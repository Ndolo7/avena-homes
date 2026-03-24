"""
services.py — Paystack integration and webhook reconciliation logic.

All business logic lives here, NOT in views.py.

PaystackWebhookService.handle_charge_success() is the main reconciliation entry point.
It covers four exhaustive edge cases:

  1. Exact Match     → Invoice paid in full.
  2. Partial Payment → Invoice partially paid; remains open.
  3. Overpayment    → Invoice closed; excess credited to tenancy.credit_balance.
  4. Orphaned        → No valid tenancy found; stored for manual admin resolution.

Every ledger/invoice mutation runs inside an atomic DB transaction.
"""
import hashlib
import hmac
import logging
from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone

from apps.tenants.models import Tenancy
from .models import Invoice, Ledger, OrphanedTransaction, Transaction

logger = logging.getLogger(__name__)

# ─── Paystack API Client ──────────────────────────────────────────────────────


class PaystackAPIClient:
    """Thin wrapper around the Paystack REST API."""

    BASE_URL = settings.PAYSTACK_BASE_URL

    @classmethod
    def _headers(cls) -> dict:
        return {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

    @classmethod
    def create_subaccount(
        cls,
        business_name: str,
        settlement_bank: str,
        account_number: str,
        percentage_charge: float = 0,
    ) -> dict:
        """
        Create a Paystack subaccount for a newly onboarded landlord.
        Returns the full Paystack response dict.
        Raises requests.HTTPError on failure.
        """
        payload = {
            "business_name": business_name,
            "settlement_bank": settlement_bank,
            "account_number": account_number,
            "percentage_charge": percentage_charge,
        }
        response = requests.post(
            f"{cls.BASE_URL}/subaccount",
            json=payload,
            headers=cls._headers(),
            timeout=15,
        )
        response.raise_for_status()
        return response.json()

    @classmethod
    def initialize_transaction(
        cls,
        email: str,
        amount_kobo: int,
        subaccount_code: str,
        reference: str,
        metadata: dict,
        bearer: str = "subaccount",
    ) -> dict:
        """
        Initialize a Paystack transaction, routing payment to the landlord's subaccount.
        `bearer='subaccount'` means the subaccount bears the Paystack fee (not the platform).
        Returns the authorization_url and access_code for frontend redirect.
        """
        payload = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
            "subaccount": subaccount_code,
            "bearer": bearer,
            "metadata": metadata,
        }
        response = requests.post(
            f"{cls.BASE_URL}/transaction/initialize",
            json=payload,
            headers=cls._headers(),
            timeout=15,
        )
        response.raise_for_status()
        return response.json()


# ─── Webhook Signature Verification ──────────────────────────────────────────


def verify_paystack_signature(payload: bytes, signature: str) -> bool:
    """
    Validate the HMAC-SHA512 signature sent by Paystack in the
    HTTP_X_PAYSTACK_SIGNATURE header.

    Must be called BEFORE any data from the request body is trusted.
    """
    secret = settings.PAYSTACK_SECRET_KEY.encode("utf-8")
    computed_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed_signature, signature)


# ─── Webhook Reconciliation Service ──────────────────────────────────────────


class PaystackWebhookService:
    """
    Stateless service class for processing Paystack webhook events.
    All public methods return a result dict for easy logging and testing.
    """

    @staticmethod
    def handle_charge_success(event_data: dict) -> dict:
        """
        Top-level dispatcher for a `charge.success` webhook event.

        Routing logic (in order):
          1. Idempotency guard: skip if already processed.
          2. Extract tenancy_id from metadata.
          3. If missing/invalid tenancy → orphan.
          4. Find the best open invoice for the tenancy.
          5. Dispatch to _reconcile_invoice (exact / partial / overpayment).
          6. If no open invoice exists → apply as advance credit.
        """
        data = event_data.get("data", {})
        reference: str = data.get("reference", "")

        # ── Guard: Idempotency ─────────────────────────────────────────────────
        if Transaction.objects.filter(
            paystack_reference=reference,
            status=Transaction.STATUS_SUCCESS,
        ).exists():
            logger.info("Duplicate webhook ignored. Reference: %s", reference)
            return {"status": "skipped", "reason": "already_processed"}

        # ── Extract payment details ────────────────────────────────────────────
        # Paystack sends amounts in the smallest currency unit (kobo / cents).
        amount_raw: int = data.get("amount", 0)
        amount = Decimal(str(amount_raw)) / 100

        metadata: dict = data.get("metadata", {}) or {}
        tenancy_id = metadata.get("tenancy_id")
        invoice_id = metadata.get("invoice_id")

        channel: str = data.get("channel", "")
        currency: str = data.get("currency", "KES")
        paystack_id: int | None = data.get("id")

        customer: dict = data.get("customer", {}) or {}
        payer_email: str = customer.get("email", "")
        payer_name: str = (
            f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
        )

        # ── Guard: Missing tenancy metadata ───────────────────────────────────
        if not tenancy_id:
            return PaystackWebhookService._create_orphan(
                reference=reference,
                amount=amount,
                currency=currency,
                channel=channel,
                payer_email=payer_email,
                raw_payload=event_data,
                reason="Missing `tenancy_id` in Paystack transaction metadata.",
            )

        # ── Guard: Tenancy must exist and be active ────────────────────────────
        try:
            tenancy = Tenancy.objects.select_related(
                "tenant__user",
                "unit__property__landlord",
            ).get(pk=tenancy_id, is_active=True)
        except Tenancy.DoesNotExist:
            return PaystackWebhookService._create_orphan(
                reference=reference,
                amount=amount,
                currency=currency,
                channel=channel,
                payer_email=payer_email,
                raw_payload=event_data,
                reason=f"Tenancy ID '{tenancy_id}' does not exist or is inactive.",
            )

        # ── Resolve target invoice ─────────────────────────────────────────────
        open_invoice: Invoice | None = PaystackWebhookService._resolve_invoice(
            tenancy=tenancy,
            invoice_id=invoice_id,
        )

        if open_invoice is None:
            # Valid tenancy but no open invoice → advance credit.
            return PaystackWebhookService._apply_advance_credit(
                tenancy=tenancy,
                reference=reference,
                paystack_id=paystack_id,
                amount=amount,
                currency=currency,
                channel=channel,
                payer_email=payer_email,
                payer_name=payer_name,
                metadata=metadata,
            )

        # ── Reconcile against the open invoice ────────────────────────────────
        return PaystackWebhookService._reconcile_invoice(
            tenancy=tenancy,
            invoice=open_invoice,
            reference=reference,
            paystack_id=paystack_id,
            amount=amount,
            currency=currency,
            channel=channel,
            payer_email=payer_email,
            payer_name=payer_name,
            metadata=metadata,
        )

    # ── Private helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _resolve_invoice(tenancy: Tenancy, invoice_id: int | None) -> Invoice | None:
        """
        Attempt to locate an open invoice for this tenancy.

        Priority:
          1. The explicit invoice_id from metadata (if it is open).
          2. The oldest overdue/partial/pending invoice for the tenancy.
        """
        open_statuses = [
            Invoice.STATUS_PENDING,
            Invoice.STATUS_PARTIAL,
            Invoice.STATUS_OVERDUE,
        ]

        if invoice_id:
            try:
                invoice = Invoice.objects.get(pk=invoice_id, tenancy=tenancy)
                if invoice.status in open_statuses:
                    return invoice
            except Invoice.DoesNotExist:
                pass

        return (
            Invoice.objects.filter(tenancy=tenancy, status__in=open_statuses)
            .order_by("due_date")
            .first()
        )

    @staticmethod
    @db_transaction.atomic
    def _reconcile_invoice(
        tenancy: Tenancy,
        invoice: Invoice,
        reference: str,
        paystack_id: int | None,
        amount: Decimal,
        currency: str,
        channel: str,
        payer_email: str,
        payer_name: str,
        metadata: dict,
    ) -> dict:
        """
        Core reconciliation logic. Atomic to prevent partial writes.

        Three sub-cases:
          - Exact: amount == balance_due → Invoice.STATUS_PAID
          - Partial: amount < balance_due → Invoice.STATUS_PARTIAL, invoice stays open
          - Overpayment: amount > balance_due → Invoice.STATUS_PAID + credit excess
        """
        balance_due: Decimal = invoice.balance_due

        # Create the immutable Transaction record first.
        txn = Transaction.objects.create(
            invoice=invoice,
            tenancy=tenancy,
            paystack_reference=reference,
            paystack_id=paystack_id,
            amount=amount,
            currency=currency,
            channel=channel,
            status=Transaction.STATUS_SUCCESS,
            payer_email=payer_email,
            payer_name=payer_name,
            metadata=metadata,
        )

        reconciliation_type: str
        ledger_description: str

        if amount == balance_due:
            # ── Case 1: Exact Match ────────────────────────────────────────────
            invoice.amount_paid += amount
            invoice.status = Invoice.STATUS_PAID
            invoice.save(update_fields=["amount_paid", "status", "updated_at"])

            ledger_description = (
                f"Full payment received. Invoice {invoice.invoice_number} settled."
            )
            reconciliation_type = "exact"
            logger.info(
                "Exact payment reconciled. Ref=%s Tenancy=%s Invoice=%s",
                reference,
                tenancy.pk,
                invoice.pk,
            )

        elif amount < balance_due:
            # ── Case 2: Partial Payment ────────────────────────────────────────
            invoice.amount_paid += amount
            invoice.status = Invoice.STATUS_PARTIAL
            invoice.save(update_fields=["amount_paid", "status", "updated_at"])

            remaining = invoice.balance_due  # recalculated after the save above
            ledger_description = (
                f"Partial payment of {amount} {currency} received against "
                f"Invoice {invoice.invoice_number}. "
                f"Remaining balance: {remaining} {currency}."
            )
            reconciliation_type = "partial"
            logger.info(
                "Partial payment reconciled. Ref=%s Tenancy=%s Invoice=%s Remaining=%s",
                reference,
                tenancy.pk,
                invoice.pk,
                remaining,
            )

        else:
            # ── Case 3: Overpayment ────────────────────────────────────────────
            excess: Decimal = amount - balance_due

            # Mark invoice fully paid (cap at amount_due).
            invoice.amount_paid = invoice.amount_due
            invoice.status = Invoice.STATUS_PAID
            invoice.save(update_fields=["amount_paid", "status", "updated_at"])

            # Credit the excess to the tenancy's running credit_balance.
            # Celery will deduct this when generating the next invoice.
            tenancy.credit_balance += excess
            tenancy.save(update_fields=["credit_balance", "updated_at"])

            ledger_description = (
                f"Overpayment of {amount} {currency} received. "
                f"Invoice {invoice.invoice_number} fully settled. "
                f"Excess of {excess} {currency} credited to tenancy balance "
                f"(new credit: {tenancy.credit_balance} {currency})."
            )
            reconciliation_type = "overpayment"
            logger.info(
                "Overpayment reconciled. Ref=%s Tenancy=%s Invoice=%s Excess=%s",
                reference,
                tenancy.pk,
                invoice.pk,
                excess,
            )

        # Write the ledger entry (append-only).
        PaystackWebhookService._write_ledger(
            tenancy=tenancy,
            transaction=txn,
            invoice=invoice,
            entry_type=Ledger.ENTRY_CREDIT,
            amount=amount,
            description=ledger_description,
        )

        return {
            "status": "processed",
            "reconciliation_type": reconciliation_type,
            "invoice_id": invoice.pk,
            "invoice_number": invoice.invoice_number,
            "transaction_id": txn.pk,
        }

    @staticmethod
    @db_transaction.atomic
    def _apply_advance_credit(
        tenancy: Tenancy,
        reference: str,
        paystack_id: int | None,
        amount: Decimal,
        currency: str,
        channel: str,
        payer_email: str,
        payer_name: str,
        metadata: dict,
    ) -> dict:
        """
        Valid tenancy but no open invoice at the time of payment.
        Store as a credit — the next Celery-generated invoice will consume it.
        """
        txn = Transaction.objects.create(
            tenancy=tenancy,
            paystack_reference=reference,
            paystack_id=paystack_id,
            amount=amount,
            currency=currency,
            channel=channel,
            status=Transaction.STATUS_SUCCESS,
            payer_email=payer_email,
            payer_name=payer_name,
            metadata=metadata,
        )

        tenancy.credit_balance += amount
        tenancy.save(update_fields=["credit_balance", "updated_at"])

        PaystackWebhookService._write_ledger(
            tenancy=tenancy,
            transaction=txn,
            invoice=None,
            entry_type=Ledger.ENTRY_CREDIT,
            amount=amount,
            description=(
                f"Advance payment of {amount} {currency} received. "
                f"No open invoice at time of payment. Credited to tenancy balance."
            ),
        )

        logger.info(
            "Advance credit applied. Ref=%s Tenancy=%s Amount=%s",
            reference,
            tenancy.pk,
            amount,
        )
        return {
            "status": "processed",
            "reconciliation_type": "advance_credit",
            "tenancy_id": tenancy.pk,
            "transaction_id": txn.pk,
        }

    @staticmethod
    @db_transaction.atomic
    def _create_orphan(
        reference: str,
        amount: Decimal,
        currency: str,
        channel: str,
        payer_email: str,
        raw_payload: dict,
        reason: str,
    ) -> dict:
        """
        Store an unreconcilable payment in OrphanedTransaction for manual review.
        Uses get_or_create for idempotency in case of webhook retries.
        """
        orphan, created = OrphanedTransaction.objects.get_or_create(
            paystack_reference=reference,
            defaults={
                "amount": amount,
                "currency": currency,
                "channel": channel,
                "payer_email": payer_email,
                "raw_payload": raw_payload,
                "failure_reason": reason,
                "status": OrphanedTransaction.STATUS_PENDING,
            },
        )

        if created:
            logger.warning(
                "Orphaned transaction created. Ref=%s Reason=%s",
                reference,
                reason,
            )
        else:
            logger.warning(
                "Duplicate orphan webhook received. Ref=%s — no action taken.",
                reference,
            )

        return {
            "status": "orphaned",
            "orphan_id": orphan.pk,
            "reason": reason,
        }

    @staticmethod
    def _write_ledger(
        tenancy: Tenancy,
        transaction: Transaction,
        invoice: Invoice | None,
        entry_type: str,
        amount: Decimal,
        description: str,
    ) -> Ledger:
        """
        Append a new ledger entry. Computes `balance_after` from the last row.
        Must always be called within an atomic block.
        """
        last_entry = (
            Ledger.objects.filter(tenancy=tenancy)
            .order_by("-created_at")
            .values("balance_after")
            .first()
        )
        previous_balance = (
            Decimal(str(last_entry["balance_after"])) if last_entry else Decimal("0")
        )

        delta = amount if entry_type == Ledger.ENTRY_CREDIT else -amount
        new_balance = previous_balance + delta

        return Ledger.objects.create(
            tenancy=tenancy,
            transaction=transaction,
            invoice=invoice,
            entry_type=entry_type,
            amount=amount,
            description=description,
            balance_after=new_balance,
        )

    @staticmethod
    @db_transaction.atomic
    def resolve_orphan(
        orphan: OrphanedTransaction,
        tenancy: Tenancy,
        resolved_by,
        resolution_notes: str = "",
    ) -> dict:
        """
        Admin action: manually assign an orphaned payment to a tenancy.
        Creates the proper Transaction and Ledger records, then marks the orphan resolved.
        Runs atomically so a failure at any step rolls everything back.
        """
        if orphan.status != OrphanedTransaction.STATUS_PENDING:
            raise ValueError(f"Orphan {orphan.pk} is already {orphan.status}.")

        # Create the canonical transaction record.
        txn = Transaction.objects.create(
            tenancy=tenancy,
            paystack_reference=orphan.paystack_reference,
            amount=orphan.amount,
            currency=orphan.currency,
            channel=orphan.channel,
            status=Transaction.STATUS_SUCCESS,
            payer_email=orphan.payer_email,
            metadata=orphan.raw_payload.get("data", {}),
        )

        # Apply to best open invoice (if any), otherwise add as credit.
        open_invoice = PaystackWebhookService._resolve_invoice(
            tenancy=tenancy, invoice_id=None
        )

        if open_invoice:
            # Re-use the full reconciliation logic.
            # Note: we don't re-call _reconcile_invoice directly to avoid
            # creating a second Transaction; instead we apply the ledger manually.
            amount = orphan.amount
            balance_due = open_invoice.balance_due

            if amount >= balance_due:
                excess = amount - balance_due
                open_invoice.amount_paid = open_invoice.amount_due
                open_invoice.status = Invoice.STATUS_PAID
                open_invoice.save(update_fields=["amount_paid", "status", "updated_at"])
                if excess:
                    tenancy.credit_balance += excess
                    tenancy.save(update_fields=["credit_balance", "updated_at"])
                desc = (
                    f"Manually resolved orphan {orphan.paystack_reference}. "
                    f"Invoice {open_invoice.invoice_number} settled."
                )
                txn.invoice = open_invoice
                txn.save(update_fields=["invoice"])
            else:
                open_invoice.amount_paid += amount
                open_invoice.status = Invoice.STATUS_PARTIAL
                open_invoice.save(update_fields=["amount_paid", "status", "updated_at"])
                desc = (
                    f"Manually resolved orphan {orphan.paystack_reference}. "
                    f"Partial payment applied to invoice {open_invoice.invoice_number}."
                )
                txn.invoice = open_invoice
                txn.save(update_fields=["invoice"])
        else:
            tenancy.credit_balance += orphan.amount
            tenancy.save(update_fields=["credit_balance", "updated_at"])
            open_invoice = None
            desc = (
                f"Manually resolved orphan {orphan.paystack_reference}. "
                f"No open invoice; credited to tenancy balance."
            )

        PaystackWebhookService._write_ledger(
            tenancy=tenancy,
            transaction=txn,
            invoice=open_invoice,
            entry_type=Ledger.ENTRY_CREDIT,
            amount=orphan.amount,
            description=desc,
        )

        # Mark the orphan as resolved.
        orphan.status = OrphanedTransaction.STATUS_RESOLVED
        orphan.resolved_by = resolved_by
        orphan.resolved_at = timezone.now()
        orphan.resolution_notes = resolution_notes
        orphan.assigned_tenancy = tenancy
        orphan.save()

        logger.info(
            "Orphan resolved. Orphan=%s Tenancy=%s By=%s",
            orphan.pk,
            tenancy.pk,
            resolved_by,
        )

        return {
            "status": "resolved",
            "orphan_id": orphan.pk,
            "transaction_id": txn.pk,
            "tenancy_id": tenancy.pk,
        }

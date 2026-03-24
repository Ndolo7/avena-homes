"""
Tests for PaystackWebhookService — all 4 reconciliation paths.
"""
import hashlib
import hmac
import json
from decimal import Decimal

import pytest
from django.test import TestCase

from apps.payments.models import Invoice, Ledger, OrphanedTransaction, Transaction
from apps.payments.services import PaystackWebhookService, verify_paystack_signature
from tests.factories import InvoiceFactory, TenancyFactory


def _make_event(amount_kobo: int, tenancy_id=None, invoice_id=None, reference="ref_TEST_001"):
    """Build a mock charge.success Paystack event payload."""
    return {
        "event": "charge.success",
        "data": {
            "id": 999,
            "reference": reference,
            "amount": amount_kobo,
            "currency": "KES",
            "channel": "mobile_money",
            "customer": {"email": "tenant@test.com", "first_name": "John", "last_name": "Doe"},
            "metadata": {
                **({"tenancy_id": tenancy_id} if tenancy_id is not None else {}),
                **({"invoice_id": invoice_id} if invoice_id is not None else {}),
            },
        },
    }


@pytest.mark.django_db
class TestExactPayment(TestCase):
    def setUp(self):
        self.invoice = InvoiceFactory(amount_due=Decimal("25000"), amount_paid=Decimal("0"))
        self.tenancy = self.invoice.tenancy

    def test_exact_payment_closes_invoice(self):
        event = _make_event(
            amount_kobo=2500000,  # 25,000 KES in kobo
            tenancy_id=self.tenancy.pk,
            invoice_id=self.invoice.pk,
        )
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["reconciliation_type"], "exact")
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)
        self.assertEqual(self.invoice.amount_paid, Decimal("25000"))

    def test_exact_payment_creates_ledger_entry(self):
        event = _make_event(2500000, tenancy_id=self.tenancy.pk, invoice_id=self.invoice.pk)
        PaystackWebhookService.handle_charge_success(event)

        entry = Ledger.objects.get(tenancy=self.tenancy)
        self.assertEqual(entry.entry_type, Ledger.ENTRY_CREDIT)
        self.assertEqual(entry.amount, Decimal("25000"))
        self.assertEqual(entry.balance_after, Decimal("25000"))

    def test_exact_payment_is_idempotent(self):
        event = _make_event(2500000, tenancy_id=self.tenancy.pk, invoice_id=self.invoice.pk)
        PaystackWebhookService.handle_charge_success(event)
        result2 = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result2["status"], "skipped")
        self.assertEqual(Transaction.objects.count(), 1)


@pytest.mark.django_db
class TestPartialPayment(TestCase):
    def setUp(self):
        self.invoice = InvoiceFactory(amount_due=Decimal("25000"), amount_paid=Decimal("0"))
        self.tenancy = self.invoice.tenancy

    def test_partial_payment_leaves_invoice_open(self):
        event = _make_event(1000000, tenancy_id=self.tenancy.pk, invoice_id=self.invoice.pk)
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["reconciliation_type"], "partial")
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PARTIAL)
        self.assertEqual(self.invoice.amount_paid, Decimal("10000"))
        self.assertEqual(self.invoice.balance_due, Decimal("15000"))

    def test_two_partial_payments_fully_settle(self):
        # First partial
        event1 = _make_event(
            1500000, tenancy_id=self.tenancy.pk,
            invoice_id=self.invoice.pk, reference="ref_partial_1"
        )
        PaystackWebhookService.handle_charge_success(event1)

        # Second partial closes it
        event2 = _make_event(
            1000000, tenancy_id=self.tenancy.pk,
            invoice_id=self.invoice.pk, reference="ref_partial_2"
        )
        PaystackWebhookService.handle_charge_success(event2)

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)
        self.assertEqual(self.invoice.amount_paid, Decimal("25000"))


@pytest.mark.django_db
class TestOverpayment(TestCase):
    def setUp(self):
        self.invoice = InvoiceFactory(amount_due=Decimal("25000"), amount_paid=Decimal("0"))
        self.tenancy = self.invoice.tenancy

    def test_overpayment_closes_invoice_and_credits_excess(self):
        # Pay 30,000 against a 25,000 invoice
        event = _make_event(3000000, tenancy_id=self.tenancy.pk, invoice_id=self.invoice.pk)
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["reconciliation_type"], "overpayment")

        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)
        self.assertEqual(self.invoice.amount_paid, Decimal("25000"))

        self.tenancy.refresh_from_db()
        self.assertEqual(self.tenancy.credit_balance, Decimal("5000"))


@pytest.mark.django_db
class TestOrphanedPayment(TestCase):
    def test_missing_tenancy_id_creates_orphan(self):
        event = _make_event(1000000, tenancy_id=None)
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["status"], "orphaned")
        self.assertTrue(OrphanedTransaction.objects.filter(status="pending").exists())

    def test_invalid_tenancy_id_creates_orphan(self):
        event = _make_event(1000000, tenancy_id=999999)
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["status"], "orphaned")
        orphan = OrphanedTransaction.objects.get()
        self.assertIn("999999", orphan.failure_reason)

    def test_orphan_idempotency(self):
        """Same reference arriving twice must not create two orphan records."""
        event = _make_event(1000000, tenancy_id=None)
        PaystackWebhookService.handle_charge_success(event)
        PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(OrphanedTransaction.objects.count(), 1)


@pytest.mark.django_db
class TestAdvanceCredit(TestCase):
    def test_payment_with_no_open_invoice_adds_credit(self):
        tenancy = TenancyFactory(credit_balance=Decimal("0"))
        # No invoice created for this tenancy
        event = _make_event(2500000, tenancy_id=tenancy.pk)
        result = PaystackWebhookService.handle_charge_success(event)

        self.assertEqual(result["reconciliation_type"], "advance_credit")
        tenancy.refresh_from_db()
        self.assertEqual(tenancy.credit_balance, Decimal("25000"))


@pytest.mark.django_db
class TestOrphanResolution(TestCase):
    def setUp(self):
        from tests.factories import AdminFactory, OrphanFactory, TenancyFactory
        self.admin = AdminFactory()
        self.tenancy = TenancyFactory()
        self.invoice = InvoiceFactory(
            tenancy=self.tenancy,
            amount_due=Decimal("10000"),
            amount_paid=Decimal("0"),
        )
        self.orphan = OrphanFactory(amount=Decimal("10000"))

    def test_resolve_orphan_creates_transaction_and_closes_invoice(self):
        result = PaystackWebhookService.resolve_orphan(
            orphan=self.orphan,
            tenancy=self.tenancy,
            resolved_by=self.admin,
            resolution_notes="Tenant confirmed payment via M-Pesa.",
        )

        self.assertEqual(result["status"], "resolved")
        self.orphan.refresh_from_db()
        self.assertEqual(self.orphan.status, OrphanedTransaction.STATUS_RESOLVED)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)

    def test_resolve_already_resolved_raises(self):
        self.orphan.status = OrphanedTransaction.STATUS_RESOLVED
        self.orphan.save()

        with self.assertRaises(ValueError):
            PaystackWebhookService.resolve_orphan(
                orphan=self.orphan,
                tenancy=self.tenancy,
                resolved_by=self.admin,
            )


class TestSignatureVerification(TestCase):
    def test_valid_signature_passes(self):
        from django.conf import settings
        payload = b'{"event":"charge.success"}'
        secret = settings.PAYSTACK_SECRET_KEY.encode()
        sig = hmac.new(secret, payload, hashlib.sha512).hexdigest()
        self.assertTrue(verify_paystack_signature(payload, sig))

    def test_invalid_signature_fails(self):
        payload = b'{"event":"charge.success"}'
        self.assertFalse(verify_paystack_signature(payload, "bad_signature"))

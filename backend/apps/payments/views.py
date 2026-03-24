"""
views.py — Payment endpoints and Paystack webhook receiver.

ViewSets:
  - PaystackWebhookView: receives charge.success events from Paystack.
  - OrphanedTransactionViewSet: list / retrieve / resolve orphaned payments.
  - InvoiceViewSet: list invoices scoped to the authenticated user.
  - TransactionViewSet: list payment transactions scoped to the authenticated user.
  - InitializeTransactionView: tenant endpoint to initialize a Paystack checkout.
  - DashboardSummaryView: aggregated stats for the landlord dashboard.
"""
import json
import logging
import uuid
from decimal import Decimal

import requests
from django.db import models as db_models
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.properties.models import Unit
from apps.tenants.models import Tenancy
from .models import Invoice, OrphanedTransaction, Transaction
from .serializers import (
    DashboardSummarySerializer,
    InvoiceSerializer,
    LedgerSerializer,
    TransactionInitializeSerializer,
    TransactionSerializer,
    OrphanedTransactionResolveSerializer,
    OrphanedTransactionSerializer,
)
from .services import PaystackAPIClient, PaystackWebhookService, verify_paystack_signature

logger = logging.getLogger(__name__)


# ─── Webhook Receiver ─────────────────────────────────────────────────────────


@method_decorator(csrf_exempt, name="dispatch")
class PaystackWebhookView(View):
    """
    Public endpoint that receives webhook events from Paystack.

    Security model:
      1. CSRF exempt (Paystack POSTs from their servers — no browser session).
      2. Signature validated via HMAC-SHA512 before any DB writes.
      3. Always returns HTTP 200 to Paystack, even for unhandled event types,
         to prevent unnecessary retries. Error details are logged server-side.

    URL: POST /api/payments/webhook/paystack/
    Authentication: None (public) — secured by signature verification only.
    """

    def post(self, request, *args, **kwargs) -> HttpResponse:
        raw_body: bytes = request.body
        signature: str = request.META.get("HTTP_X_PAYSTACK_SIGNATURE", "")

        # ── Step 1: Verify Paystack signature ─────────────────────────────────
        if not verify_paystack_signature(raw_body, signature):
            logger.warning(
                "Paystack webhook received with invalid signature. IP=%s",
                request.META.get("REMOTE_ADDR"),
            )
            # Return 400 to signal rejection without exposing details.
            return HttpResponse(status=400)

        # ── Step 2: Parse JSON body ────────────────────────────────────────────
        try:
            event: dict = json.loads(raw_body)
        except json.JSONDecodeError:
            logger.error("Paystack webhook body is not valid JSON.")
            return HttpResponse(status=400)

        event_type: str = event.get("event", "")

        # ── Step 3: Route event type ───────────────────────────────────────────
        if event_type == "charge.success":
            result = PaystackWebhookService.handle_charge_success(event)
            logger.info("charge.success processed. Result=%s", result)
        else:
            logger.info("Unhandled webhook event type received: %s", event_type)

        # ── Step 4: Always acknowledge to Paystack ─────────────────────────────
        # Paystack retries on any non-2xx response, so we always return 200
        # and handle errors internally.
        return HttpResponse(status=200)


# ─── Orphaned Transaction (Reconciliation Queue) ──────────────────────────────


class IsAdminOrLandlord(permissions.BasePermission):
    """Allows access only to platform admins and landlords."""

    def has_permission(self, request: Request, view) -> bool:
        return request.user.is_authenticated and request.user.role in (
            "admin",
            "landlord",
        )

    def has_object_permission(self, request: Request, view, obj) -> bool:
        if request.user.role == "admin":
            return True
        # Landlords can only see orphans belonging to their properties.
        if hasattr(obj, "assigned_tenancy") and obj.assigned_tenancy:
            return obj.assigned_tenancy.unit.property.landlord == request.user
        return request.user.role == "admin"


class IsTenant(permissions.BasePermission):
    """Allows access only to tenant users."""

    def has_permission(self, request: Request, view) -> bool:
        return request.user.is_authenticated and request.user.role == "tenant"


class OrphanedTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides the Pending Reconciliation queue for the admin dashboard.

    list    GET  /api/payments/orphans/
    retrieve GET /api/payments/orphans/{id}/
    resolve POST /api/payments/orphans/{id}/resolve/
    dismiss POST /api/payments/orphans/{id}/dismiss/
    """

    serializer_class = OrphanedTransactionSerializer
    permission_classes = [IsAdminOrLandlord]

    def get_queryset(self):
        qs = OrphanedTransaction.objects.select_related("resolved_by", "assigned_tenancy")
        # Platform admins see all; landlords see only their relevant orphans.
        if self.request.user.role == "admin":
            return qs
        # For landlords, show only pending orphans (they can't resolve without admin context).
        return qs.filter(status=OrphanedTransaction.STATUS_PENDING)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request: Request, pk=None) -> Response:
        """
        Admin action: manually assign an orphaned payment to a Tenancy.
        Triggers full service-layer reconciliation atomically.
        """
        if request.user.role != "admin":
            return Response(
                {"detail": "Only platform admins can resolve orphaned transactions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        orphan: OrphanedTransaction = self.get_object()

        if orphan.status != OrphanedTransaction.STATUS_PENDING:
            return Response(
                {"detail": f"This transaction is already '{orphan.status}' and cannot be re-resolved."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = OrphanedTransactionResolveSerializer(
            data=request.data,
            context={"orphan": orphan},
        )
        serializer.is_valid(raise_exception=True)

        result = PaystackWebhookService.resolve_orphan(
            orphan=orphan,
            tenancy=serializer.validated_data["tenancy"],
            resolved_by=request.user,
            resolution_notes=serializer.validated_data.get("resolution_notes", ""),
        )

        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="dismiss")
    def dismiss(self, request: Request, pk=None) -> Response:
        """
        Admin action: dismiss an orphan (e.g. confirmed test payment).
        Requires a dismissal note.
        """
        if request.user.role != "admin":
            return Response(
                {"detail": "Only platform admins can dismiss orphaned transactions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        orphan: OrphanedTransaction = self.get_object()

        if orphan.status != OrphanedTransaction.STATUS_PENDING:
            return Response(
                {"detail": f"Transaction is already '{orphan.status}'."},
                status=status.HTTP_409_CONFLICT,
            )

        notes = request.data.get("resolution_notes", "").strip()
        if not notes:
            return Response(
                {"detail": "A dismissal note is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orphan.status = OrphanedTransaction.STATUS_DISMISSED
        orphan.resolved_by = request.user
        orphan.resolved_at = timezone.now()
        orphan.resolution_notes = notes
        orphan.save()

        return Response({"status": "dismissed", "orphan_id": orphan.pk})


# ─── Invoice ViewSet ──────────────────────────────────────────────────────────


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve invoices scoped to the authenticated landlord's properties.

    Tenants see only their own invoices. Landlords see all invoices
    for units they own. Admins see everything.
    """

    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Invoice.objects.select_related("tenancy__unit__property").all()

        if user.role == "landlord":
            return Invoice.objects.filter(
                tenancy__unit__property__landlord=user
            ).select_related("tenancy__unit__property")

        # Tenant: only their own invoices across all their tenancies.
        if hasattr(user, "tenant_profile"):
            return Invoice.objects.filter(
                tenancy__tenant=user.tenant_profile
            ).select_related("tenancy__unit__property")

        return Invoice.objects.none()

    @action(detail=True, methods=["get"], url_path="ledger")
    def ledger(self, request: Request, pk=None) -> Response:
        """Return the full ledger history for a specific invoice."""
        invoice = self.get_object()
        entries = invoice.ledger_entries.all().order_by("created_at")
        serializer = LedgerSerializer(entries, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List/retrieve payment transactions scoped to the authenticated user.

    Tenants see only their own transactions. Landlords see transactions
    for units they own. Admins see everything.
    """

    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.select_related(
            "invoice",
            "tenancy__tenant__user",
            "tenancy__unit__property",
        )

        if user.role == "admin":
            scoped = qs
        elif user.role == "landlord":
            scoped = qs.filter(tenancy__unit__property__landlord=user)
        elif hasattr(user, "tenant_profile"):
            scoped = qs.filter(tenancy__tenant=user.tenant_profile)
        else:
            scoped = qs.none()

        invoice_id = self.request.query_params.get("invoice")
        if invoice_id:
            scoped = scoped.filter(invoice_id=invoice_id)

        return scoped


class InitializeTransactionView(APIView):
    """
    Tenant endpoint to initialize a Paystack checkout for a specific invoice.

    POST /api/payments/transactions/initialize/
    Payload: { "invoice_id": <int>, "amount": <decimal optional> }
    """

    permission_classes = [permissions.IsAuthenticated, IsTenant]

    def post(self, request: Request) -> Response:
        serializer = TransactionInitializeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invoice: Invoice = serializer.validated_data["invoice"]
        amount: Decimal = serializer.validated_data.get("amount") or invoice.balance_due

        # Tenants can only initialize checkout for their own invoices.
        tenant_profile = getattr(request.user, "tenant_profile", None)
        if tenant_profile is None or invoice.tenancy.tenant_id != tenant_profile.pk:
            return Response(
                {"detail": "You can only pay your own invoices."},
                status=status.HTTP_403_FORBIDDEN,
            )

        open_statuses = {
            Invoice.STATUS_PENDING,
            Invoice.STATUS_PARTIAL,
            Invoice.STATUS_OVERDUE,
        }
        if invoice.status not in open_statuses or invoice.balance_due <= 0:
            return Response(
                {"detail": "This invoice is already settled."},
                status=status.HTTP_409_CONFLICT,
            )

        if amount <= 0:
            return Response(
                {"detail": "Amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        landlord = invoice.tenancy.unit.property.landlord
        subaccount = getattr(landlord, "paystack_subaccount", None)
        if not subaccount or not subaccount.is_active:
            return Response(
                {"detail": "Landlord payout account is not configured for Paystack."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reference = f"rent_{invoice.pk}_{uuid.uuid4().hex[:16]}"
        amount_kobo = int((amount * Decimal("100")).to_integral_value())

        metadata = {
            "tenancy_id": invoice.tenancy_id,
            "invoice_id": invoice.pk,
            "tenant_id": tenant_profile.pk,
            "tenant_user_id": request.user.pk,
        }

        try:
            paystack_response = PaystackAPIClient.initialize_transaction(
                email=request.user.email,
                amount_kobo=amount_kobo,
                subaccount_code=subaccount.subaccount_code,
                reference=reference,
                metadata=metadata,
            )
        except requests.HTTPError as exc:
            message = "Failed to initialize payment with Paystack."
            try:
                payload = exc.response.json()
                message = payload.get("message") or message
            except Exception:
                pass
            logger.exception(
                "Paystack initialize failed for invoice=%s tenant=%s",
                invoice.pk,
                request.user.pk,
            )
            return Response({"detail": message}, status=status.HTTP_502_BAD_GATEWAY)
        except requests.RequestException:
            logger.exception(
                "Paystack request error for invoice=%s tenant=%s",
                invoice.pk,
                request.user.pk,
            )
            return Response(
                {"detail": "Unable to reach Paystack. Please try again shortly."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = paystack_response.get("data") or {}
        authorization_url = data.get("authorization_url")
        access_code = data.get("access_code")
        response_reference = data.get("reference") or reference

        if not authorization_url or not access_code:
            logger.error(
                "Unexpected Paystack initialize payload for invoice=%s response=%s",
                invoice.pk,
                paystack_response,
            )
            return Response(
                {"detail": "Invalid response from Paystack."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "invoice_id": invoice.pk,
                "reference": response_reference,
                "access_code": access_code,
                "authorization_url": authorization_url,
                "amount": str(amount),
                "currency": "KES",
                "public_key": data.get("public_key"),  # present on some Paystack responses
            },
            status=status.HTTP_200_OK,
        )


# ─── Dashboard Summary ────────────────────────────────────────────────────────


class DashboardSummaryView(APIView):
    """
    Aggregated statistics for the landlord dashboard header.

    GET /api/payments/dashboard/summary/
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOrLandlord]

    def get(self, request: Request) -> Response:
        user = request.user

        # Scope all queries to the landlord's own properties.
        if user.role == "admin":
            units_qs = Unit.objects.all()
            tenancies_qs = Tenancy.objects.filter(is_active=True)
            invoices_qs = Invoice.objects.filter(
                status__in=[Invoice.STATUS_PENDING, Invoice.STATUS_PARTIAL, Invoice.STATUS_OVERDUE]
            )
            orphans_count = OrphanedTransaction.objects.filter(
                status=OrphanedTransaction.STATUS_PENDING
            ).count()
        else:
            units_qs = Unit.objects.filter(property__landlord=user)
            tenancies_qs = Tenancy.objects.filter(
                unit__property__landlord=user, is_active=True
            )
            invoices_qs = Invoice.objects.filter(
                tenancy__unit__property__landlord=user,
                status__in=[Invoice.STATUS_PENDING, Invoice.STATUS_PARTIAL, Invoice.STATUS_OVERDUE],
            )
            orphans_count = OrphanedTransaction.objects.filter(
                status=OrphanedTransaction.STATUS_PENDING,
                assigned_tenancy__unit__property__landlord=user,
            ).count()

        total_units = units_qs.count()
        occupied = units_qs.filter(status=Unit.STATUS_OCCUPIED).count()
        vacant = units_qs.filter(status=Unit.STATUS_VACANT).count()
        maintenance = units_qs.filter(status=Unit.STATUS_MAINTENANCE).count()
        vacancy_loss_agg = units_qs.filter(status=Unit.STATUS_VACANT).aggregate(
            total=db_models.Sum("base_rent")
        )

        occupancy_rate = (occupied / total_units * 100) if total_units > 0 else 0.0

        invoice_agg = invoices_qs.aggregate(
            total=db_models.Sum(
                db_models.ExpressionWrapper(
                    db_models.F("amount_due") - db_models.F("amount_paid"),
                    output_field=db_models.DecimalField(),
                )
            )
        )

        credit_agg = tenancies_qs.aggregate(total=db_models.Sum("credit_balance"))

        summary = {
            "total_properties": (
                units_qs.values("property").distinct().count()
            ),
            "total_units": total_units,
            "occupied_units": occupied,
            "vacant_units": vacant,
            "maintenance_units": maintenance,
            "occupancy_rate": round(occupancy_rate, 1),
            "pending_invoices_count": invoices_qs.count(),
            "pending_invoices_total": invoice_agg["total"] or 0,
            "vacancy_revenue_loss": vacancy_loss_agg["total"] or 0,
            "orphaned_payments_count": orphans_count,
            "credit_balance_total": credit_agg["total"] or 0,
        }

        serializer = DashboardSummarySerializer(summary)
        return Response(serializer.data)

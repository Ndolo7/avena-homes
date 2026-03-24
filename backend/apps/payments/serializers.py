"""
Serializers for the payments app.

Covers:
  - Invoice read/list
  - Transaction read
  - Ledger read
  - OrphanedTransaction read + resolution write
  - Dashboard summary (aggregated, not a model serializer)
"""
from decimal import Decimal

from rest_framework import serializers

from apps.tenants.models import Tenancy
from .models import Invoice, Ledger, OrphanedTransaction, Transaction


class InvoiceSerializer(serializers.ModelSerializer):
    balance_due = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    tenancy_display = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "tenancy",
            "tenancy_display",
            "amount_due",
            "amount_paid",
            "balance_due",
            "status",
            "due_date",
            "period_start",
            "period_end",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "invoice_number", "amount_paid", "status", "created_at", "updated_at"]

    def get_tenancy_display(self, obj: Invoice) -> str:
        return str(obj.tenancy)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            "id",
            "invoice",
            "tenancy",
            "paystack_reference",
            "paystack_id",
            "amount",
            "currency",
            "channel",
            "status",
            "payer_email",
            "payer_name",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class TransactionInitializeSerializer(serializers.Serializer):
    """
    Request payload for tenant-initiated Paystack checkout.
    """

    invoice_id = serializers.PrimaryKeyRelatedField(
        queryset=Invoice.objects.select_related(
            "tenancy__tenant__user",
            "tenancy__unit__property__landlord",
        ),
        source="invoice",
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        min_value=Decimal("1.00"),
    )


class LedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ledger
        fields = [
            "id",
            "tenancy",
            "transaction",
            "invoice",
            "entry_type",
            "amount",
            "description",
            "balance_after",
            "created_at",
        ]
        read_only_fields = fields


class OrphanedTransactionSerializer(serializers.ModelSerializer):
    """Read serializer for the reconciliation queue."""

    resolved_by_display = serializers.SerializerMethodField()

    class Meta:
        model = OrphanedTransaction
        fields = [
            "id",
            "paystack_reference",
            "amount",
            "currency",
            "payer_email",
            "channel",
            "status",
            "failure_reason",
            "raw_payload",
            "resolved_by",
            "resolved_by_display",
            "resolved_at",
            "resolution_notes",
            "assigned_tenancy",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "paystack_reference",
            "amount",
            "currency",
            "payer_email",
            "channel",
            "failure_reason",
            "raw_payload",
            "resolved_by",
            "resolved_by_display",
            "resolved_at",
            "created_at",
        ]

    def get_resolved_by_display(self, obj: OrphanedTransaction) -> str | None:
        return str(obj.resolved_by) if obj.resolved_by else None


class OrphanedTransactionResolveSerializer(serializers.Serializer):
    """
    Write serializer for admin resolution of an orphaned transaction.
    Requires the target tenancy and optional notes.
    """
    tenancy_id = serializers.PrimaryKeyRelatedField(
        queryset=Tenancy.objects.filter(is_active=True),
        source="tenancy",
    )
    resolution_notes = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_tenancy_id(self, tenancy: Tenancy):
        """Ensure the target tenancy has no conflicting reference for this payment."""
        orphan: OrphanedTransaction = self.context["orphan"]
        if Transaction.objects.filter(
            tenancy=tenancy,
            paystack_reference=orphan.paystack_reference,
        ).exists():
            raise serializers.ValidationError(
                "A transaction with this Paystack reference already exists for the selected tenancy."
            )
        return tenancy


class DashboardSummarySerializer(serializers.Serializer):
    """
    Aggregated stats for the landlord dashboard header.
    Not tied to a single model — built from cross-model queries in the view.
    """
    total_properties = serializers.IntegerField()
    total_units = serializers.IntegerField()
    occupied_units = serializers.IntegerField()
    vacant_units = serializers.IntegerField()
    maintenance_units = serializers.IntegerField()
    occupancy_rate = serializers.FloatField(help_text="Percentage, e.g. 87.5")
    pending_invoices_count = serializers.IntegerField()
    pending_invoices_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    vacancy_revenue_loss = serializers.DecimalField(max_digits=14, decimal_places=2)
    orphaned_payments_count = serializers.IntegerField()
    credit_balance_total = serializers.DecimalField(max_digits=14, decimal_places=2)

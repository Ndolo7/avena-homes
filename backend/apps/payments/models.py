"""
Payment models: PaystackSubaccount, Invoice, Transaction, Ledger, OrphanedTransaction.

Design guarantees:
  - Funds flow: Tenant → Paystack → Landlord Subaccount (T+1). Platform never holds funds.
  - All ledger mutations happen inside atomic DB transactions (enforced in services.py).
  - OrphanedTransaction is the compliance table for any payment that cannot be
    automatically matched to a Tenancy — requires manual admin resolution.
"""
from django.conf import settings
from django.db import models

from apps.properties.models import TimeStampedModel
from apps.tenants.models import Tenancy


class PaystackSubaccount(TimeStampedModel):
    """
    Paystack subaccount linked to a Landlord.
    Created by the platform (using the master Paystack key) during landlord onboarding.
    Landlords never interact with Paystack API keys directly.
    """
    landlord = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paystack_subaccount",
        limit_choices_to={"role": "landlord"},
    )
    subaccount_code = models.CharField(max_length=100, unique=True, db_index=True)
    business_name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_code = models.CharField(max_length=20)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=255, blank=True)
    # Platform's percentage fee collected on each transaction (e.g., 2.50 = 2.5%).
    percentage_charge = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    # Full Paystack API response stored for audit purposes.
    paystack_response = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Paystack Subaccount"

    def __str__(self) -> str:
        return f"{self.business_name} ({self.subaccount_code})"


class Invoice(TimeStampedModel):
    """
    A rent demand note issued against a Tenancy for a specific billing period.
    Tracks partial payments via amount_paid; status reflects reconciliation state.
    """
    STATUS_PENDING = "pending"
    STATUS_PARTIAL = "partial"
    STATUS_PAID = "paid"
    STATUS_OVERDUE = "overdue"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PARTIAL, "Partially Paid"),
        (STATUS_PAID, "Paid"),
        (STATUS_OVERDUE, "Overdue"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    tenancy = models.ForeignKey(
        Tenancy,
        on_delete=models.PROTECT,
        related_name="invoices",
    )
    # Human-readable identifier, e.g. "INV-2024-001234"
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    due_date = models.DateField(db_index=True)
    # Billing period this invoice covers.
    period_start = models.DateField()
    period_end = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-due_date"]

    def __str__(self) -> str:
        return f"{self.invoice_number} — {self.tenancy} ({self.status})"

    @property
    def balance_due(self):
        return self.amount_due - self.amount_paid


class Transaction(TimeStampedModel):
    """
    An immutable record of a single Paystack charge event.

    Both `invoice` and `tenancy` are nullable to accommodate the case where
    a payment arrives but cannot be matched (before it is orphaned). Once
    reconciled, invoice and tenancy are always set.
    """
    CHANNEL_CARD = "card"
    CHANNEL_MOBILE_MONEY = "mobile_money"
    CHANNEL_BANK_TRANSFER = "bank_transfer"
    CHANNEL_CHOICES = [
        (CHANNEL_CARD, "Card"),
        (CHANNEL_MOBILE_MONEY, "Mobile Money (M-Pesa)"),
        (CHANNEL_BANK_TRANSFER, "Bank Transfer"),
    ]

    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_PENDING = "pending"
    STATUS_CHOICES = [
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_PENDING, "Pending"),
    ]

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="transactions",
        null=True,
        blank=True,
    )
    tenancy = models.ForeignKey(
        Tenancy,
        on_delete=models.PROTECT,
        related_name="transactions",
        null=True,
        blank=True,
    )
    paystack_reference = models.CharField(max_length=100, unique=True, db_index=True)
    paystack_id = models.BigIntegerField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="KES")
    channel = models.CharField(max_length=30, choices=CHANNEL_CHOICES, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    payer_email = models.EmailField(blank=True)
    payer_name = models.CharField(max_length=255, blank=True)
    # Full metadata from Paystack for traceability.
    metadata = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"TXN {self.paystack_reference} — {self.amount} {self.currency} ({self.status})"


class Ledger(TimeStampedModel):
    """
    An append-only accounting ledger scoped to a Tenancy.

    Each row represents a credit or debit event with a running balance snapshot.
    Never updated — only inserted. Deleting ledger rows is a compliance violation.
    """
    ENTRY_CREDIT = "credit"
    ENTRY_DEBIT = "debit"
    ENTRY_CHOICES = [
        (ENTRY_CREDIT, "Credit"),
        (ENTRY_DEBIT, "Debit"),
    ]

    tenancy = models.ForeignKey(
        Tenancy,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        null=True,
        blank=True,
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="ledger_entries",
        null=True,
        blank=True,
    )
    entry_type = models.CharField(max_length=10, choices=ENTRY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=500)
    # Snapshot of the tenancy's total credited amount after this entry.
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.entry_type.upper()} {self.amount} — Tenancy #{self.tenancy_id}"


class OrphanedTransaction(TimeStampedModel):
    """
    Compliance table for payments that could not be automatically matched
    to a Tenancy during webhook reconciliation.

    Causes:
      - Missing `tenancy_id` in Paystack metadata.
      - Invalid / inactive tenancy_id.
      - No open invoice for an otherwise valid tenancy.

    Resolution: A Platform Admin manually assigns the payment to a Tenancy
    via the dashboard. Upon resolution, a proper Transaction and Ledger entry
    are created and the orphan is marked resolved.
    """
    STATUS_PENDING = "pending"
    STATUS_RESOLVED = "resolved"
    STATUS_DISMISSED = "dismissed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending Review"),
        (STATUS_RESOLVED, "Resolved"),
        (STATUS_DISMISSED, "Dismissed"),
    ]

    paystack_reference = models.CharField(max_length=100, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="KES")
    payer_email = models.EmailField(blank=True)
    channel = models.CharField(max_length=30, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    # Exact reason this transaction could not be auto-reconciled.
    failure_reason = models.CharField(max_length=500)
    # Complete Paystack webhook payload for compliance and manual review.
    raw_payload = models.JSONField(default=dict)

    # Resolution tracking
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_orphans",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    # Set when an admin manually assigns this orphan to a tenancy.
    assigned_tenancy = models.ForeignKey(
        Tenancy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orphaned_transactions",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Orphaned Transaction"

    def __str__(self) -> str:
        return f"ORPHAN {self.paystack_reference} — {self.amount} {self.currency} ({self.status})"

"""
Tenant and Tenancy models.

CRITICAL DESIGN DECISION — Tenant ≠ Tenancy
─────────────────────────────────────────────
Tenant:  The *person*. Stores KYC, identity, and the linked user account.
         A Tenant is a global, reusable entity independent of any property.

Tenancy: The *lease* — the time-bound contract connecting a Tenant to a Unit.
         Invoices, ledger entries, and payment metadata are always scoped
         to a Tenancy, never directly to a Tenant.

This separation allows:
  - One Tenant to have simultaneous Tenancies (renting multiple units).
  - Historical Tenancies to be preserved after a move-out.
  - Correct financial attribution when a tenant relocates to a different unit.
"""
from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.properties.models import TimeStampedModel, Unit


class Tenant(TimeStampedModel):
    """
    The person. Contains identity/KYC data and a 1:1 link to a system User.
    A Tenant record is created once and reused across all their Tenancies.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_profile",
    )
    # The landlord who onboarded this tenant. Set on creation so the tenant
    # is visible even before a tenancy is assigned.
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="onboarded_tenants",
    )
    phone_number = models.CharField(max_length=30)
    national_id = models.CharField(max_length=20, unique=True)
    kra_pin = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["user__first_name", "user__last_name"]

    def __str__(self) -> str:
        return f"{self.user.get_full_name()} (ID: {self.national_id})"

    @property
    def active_tenancies(self):
        return self.tenancies.filter(is_active=True)


class Tenancy(TimeStampedModel):
    """
    The lease. Connects a Tenant to a Unit for a specific period.

    This is the central pivot for all financial operations:
      - Invoices reference a Tenancy.
      - Transactions reference a Tenancy (and optionally an Invoice).
      - Ledger entries are scoped to a Tenancy.
      - `credit_balance` accumulates overpayments and advance payments,
        automatically reducing the next generated invoice.
    """
    BILLING_MONTHLY = "monthly"
    BILLING_QUARTERLY = "quarterly"
    BILLING_ANNUAL = "annual"
    BILLING_CHOICES = [
        (BILLING_MONTHLY, "Monthly"),
        (BILLING_QUARTERLY, "Quarterly"),
        (BILLING_ANNUAL, "Annual"),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.PROTECT,  # Prevent deletion of a Tenant with history
        related_name="tenancies",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.PROTECT,
        related_name="tenancies",
    )

    # Rent terms — independent of unit.base_rent to allow negotiated rates.
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    billing_cycle = models.CharField(
        max_length=20, choices=BILLING_CHOICES, default=BILLING_MONTHLY
    )
    # Day of the month when rent invoices are generated (1–28 to be safe).
    billing_day = models.PositiveSmallIntegerField(default=1)

    move_in_date = models.DateField()
    move_out_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    # Accumulated credit from overpayments or advance payments.
    # Celery task deducts this when generating the next invoice.
    credit_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    notes = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Tenancies"
        ordering = ["-created_at"]
        constraints = [
            # Only one *active* tenancy per unit at any time.
            models.UniqueConstraint(
                fields=["unit"],
                condition=Q(is_active=True),
                name="unique_active_tenancy_per_unit",
            )
        ]

    def __str__(self) -> str:
        return (
            f"{self.tenant.user.get_full_name()} → Unit {self.unit.unit_number} "
            f"({self.unit.property.name})"
        )

    @property
    def open_invoices(self):
        from apps.payments.models import Invoice
        return self.invoices.filter(
            status__in=[
                Invoice.STATUS_PENDING,
                Invoice.STATUS_PARTIAL,
                Invoice.STATUS_OVERDUE,
            ]
        )

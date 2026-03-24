"""
Celery tasks for automated billing operations.

Tasks:
  generate_monthly_invoices — creates Invoice records for every active Tenancy
                               whose billing_day matches today, applying any
                               existing credit_balance as a deduction.
  mark_overdue_invoices      — transitions pending invoices past their due_date
                               to STATUS_OVERDUE.
  send_rent_reminders        — placeholder for SMS/email reminders (integrate
                               with an email/SMS provider of choice).
"""
import logging
from datetime import date, timedelta
from decimal import Decimal

from celery import shared_task
from django.db import transaction as db_transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_monthly_invoices(self):
    """
    Generate one invoice per active tenancy whose billing_day matches today.
    Automatically deducts any accumulated credit_balance from the invoice amount.
    """
    from apps.payments.models import Invoice
    from apps.tenants.models import Tenancy

    today = date.today()
    generated = 0

    tenancies = Tenancy.objects.filter(
        is_active=True,
        billing_day=today.day,
        billing_cycle="monthly",
    ).select_related("unit__property__landlord")

    for tenancy in tenancies:
        period_start = today
        period_end = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        # Check if an invoice for this period already exists (idempotency).
        if Invoice.objects.filter(
            tenancy=tenancy,
            period_start=period_start,
        ).exists():
            continue

        with db_transaction.atomic():
            effective_amount = tenancy.rent_amount
            credit_used = Decimal("0")

            if tenancy.credit_balance > 0:
                credit_used = min(tenancy.credit_balance, effective_amount)
                effective_amount -= credit_used
                tenancy.credit_balance -= credit_used
                tenancy.save(update_fields=["credit_balance", "updated_at"])

            invoice_number = f"INV-{today.strftime('%Y%m')}-{tenancy.pk:06d}"

            Invoice.objects.create(
                tenancy=tenancy,
                invoice_number=invoice_number,
                amount_due=effective_amount,
                amount_paid=Decimal("0"),
                status=Invoice.STATUS_PENDING,
                due_date=today,
                period_start=period_start,
                period_end=period_end,
                notes=f"Credit applied: {credit_used} KES" if credit_used else "",
            )
            generated += 1
            logger.info("Invoice generated for Tenancy=%s Amount=%s", tenancy.pk, effective_amount)

    logger.info("generate_monthly_invoices complete. Generated=%d", generated)
    return generated


@shared_task(bind=True, max_retries=3)
def mark_overdue_invoices(self):
    """Mark all pending/partial invoices past their due date as OVERDUE."""
    from apps.payments.models import Invoice

    today = date.today()
    updated = Invoice.objects.filter(
        status__in=[Invoice.STATUS_PENDING, Invoice.STATUS_PARTIAL],
        due_date__lt=today,
    ).update(status=Invoice.STATUS_OVERDUE)

    logger.info("mark_overdue_invoices: %d invoices marked overdue.", updated)
    return updated


@shared_task(bind=True, max_retries=3)
def send_rent_reminders(self):
    """
    Send rent reminders to tenants whose billing_day is 5 days from now.
    Integrate your email/SMS provider here (e.g. SendGrid, Africa's Talking).
    """
    from apps.tenants.models import Tenancy

    target_day = (date.today() + timedelta(days=5)).day
    tenancies = Tenancy.objects.filter(
        is_active=True,
        billing_day=target_day,
    ).select_related("tenant__user")

    count = 0
    for tenancy in tenancies:
        tenant_email = tenancy.tenant.user.email
        # TODO: integrate email/SMS provider
        logger.info(
            "Reminder queued for %s — Tenancy=%s Amount=%s",
            tenant_email,
            tenancy.pk,
            tenancy.rent_amount,
        )
        count += 1

    return count

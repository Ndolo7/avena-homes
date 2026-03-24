"""
Celery application for avena-homes.

Beat tasks:
  - generate_monthly_invoices: runs on the 1st of each month at 06:00 EAT.
  - mark_overdue_invoices: runs daily at 01:00 EAT.
  - send_rent_reminders: runs 5 days before billing_day for each tenancy.
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("avena_homes")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    # Generate rent invoices — 1st of every month at 06:00
    "generate-monthly-invoices": {
        "task": "apps.payments.tasks.generate_monthly_invoices",
        "schedule": crontab(hour=6, minute=0, day_of_month=1),
    },
    # Mark pending invoices overdue — daily at 01:00
    "mark-overdue-invoices": {
        "task": "apps.payments.tasks.mark_overdue_invoices",
        "schedule": crontab(hour=1, minute=0),
    },
    # Send rent reminders 5 days before due — daily at 08:00
    "send-rent-reminders": {
        "task": "apps.payments.tasks.send_rent_reminders",
        "schedule": crontab(hour=8, minute=0),
    },
}

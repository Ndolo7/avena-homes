from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardSummaryView,
    InvoiceViewSet,
    InitializeTransactionView,
    OrphanedTransactionViewSet,
    PaystackWebhookView,
    TransactionViewSet,
)

router = DefaultRouter()
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"orphans", OrphanedTransactionViewSet, basename="orphan")
router.register(r"transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    # Paystack webhook — public, signature-secured.
    path("webhook/paystack/", PaystackWebhookView.as_view(), name="paystack_webhook"),

    # Tenant checkout initialization.
    path(
        "transactions/initialize/",
        InitializeTransactionView.as_view(),
        name="transaction_initialize",
    ),

    # Landlord dashboard summary aggregation.
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard_summary"),

    # Router-generated routes.
    path("", include(router.urls)),
]

"""
Integration tests for all REST API endpoints.
Uses DRF's APIClient with JWT authentication.
"""
import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.conf import settings
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.payments.models import Invoice, OrphanedTransaction
from apps.properties.models import Unit
from tests.factories import (
    AdminFactory,
    InvoiceFactory,
    LandlordFactory,
    OrphanFactory,
    PaystackSubaccountFactory,
    PropertyFactory,
    TenancyFactory,
    TenantProfileFactory,
    TenantUserFactory,
    TransactionFactory,
    UnitFactory,
)


def auth_client(user) -> APIClient:
    """Return an authenticated APIClient for the given user."""
    client = APIClient()
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return client


def make_webhook_payload(data: dict) -> tuple[bytes, str]:
    """Return (raw_bytes, signature) for a Paystack webhook payload."""
    raw = json.dumps({"event": "charge.success", "data": data}).encode()
    secret = settings.PAYSTACK_SECRET_KEY.encode()
    sig = hmac.new(secret, raw, hashlib.sha512).hexdigest()
    return raw, sig


# ─── Auth ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAuthEndpoints(TestCase):
    def test_register_landlord(self):
        client = APIClient()
        resp = client.post("/api/accounts/register/", {
            "email": "newlandlord@test.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "role": "landlord",
            "password": "Str0ngPass!2024",
            "password2": "Str0ngPass!2024",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_obtain_jwt_token(self):
        user = LandlordFactory(email="jwt@test.com")
        user.set_password("testpass123!")
        user.save()
        resp = APIClient().post("/api/auth/token/", {
            "email": "jwt@test.com",
            "password": "testpass123!",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_me_returns_user_data(self):
        user = LandlordFactory()
        client = auth_client(user)
        resp = client.get("/api/accounts/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], user.email)

    def test_unauthenticated_returns_401(self):
        resp = APIClient().get("/api/accounts/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ─── Properties ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPropertyEndpoints(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.other_landlord = LandlordFactory()
        self.client = auth_client(self.landlord)

    def test_create_property(self):
        resp = self.client.post("/api/properties/", {
            "name": "Avena Heights",
            "address": "123 Ngong Road, Nairobi",
            "county": "Nairobi",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["name"], "Avena Heights")

    def test_landlord_only_sees_own_properties(self):
        PropertyFactory(landlord=self.landlord)
        PropertyFactory(landlord=self.other_landlord)
        resp = self.client.get("/api/properties/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_tenant_cannot_create_property(self):
        tenant_user = TenantUserFactory()
        client = auth_client(tenant_user)
        resp = client.post("/api/properties/", {
            "name": "My House",
            "address": "Somewhere",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_unit_under_property(self):
        prop = PropertyFactory(landlord=self.landlord)
        resp = self.client.post("/api/properties/units/", {
            "property": prop.pk,
            "unit_number": "A01",
            "bedrooms": 2,
            "bathrooms": 1,
            "base_rent": "18000.00",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)


# ─── Tenants & Tenancies ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestTenancyEndpoints(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.client = auth_client(self.landlord)
        self.property = PropertyFactory(landlord=self.landlord)
        self.unit = UnitFactory(property=self.property, status=Unit.STATUS_VACANT)
        self.tenant_profile = TenantProfileFactory()

    def test_create_tenancy_marks_unit_occupied(self):
        resp = self.client.post("/api/tenants/tenancies/", {
            "tenant": self.tenant_profile.pk,
            "unit": self.unit.pk,
            "rent_amount": "20000.00",
            "deposit_amount": "20000.00",
            "billing_day": 1,
            "move_in_date": "2024-02-01",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.unit.refresh_from_db()
        self.assertEqual(self.unit.status, Unit.STATUS_OCCUPIED)

    def test_cannot_create_two_active_tenancies_on_same_unit(self):
        TenancyFactory(unit=self.unit, is_active=True)
        resp = self.client.post("/api/tenants/tenancies/", {
            "tenant": self.tenant_profile.pk,
            "unit": self.unit.pk,
            "rent_amount": "20000.00",
            "deposit_amount": "20000.00",
            "billing_day": 1,
            "move_in_date": "2024-03-01",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# ─── Dashboard Summary ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestDashboardSummary(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.client = auth_client(self.landlord)
        prop = PropertyFactory(landlord=self.landlord)
        UnitFactory(property=prop, status=Unit.STATUS_OCCUPIED, base_rent=Decimal("20000"))
        UnitFactory(property=prop, status=Unit.STATUS_VACANT, base_rent=Decimal("15000"))
        UnitFactory(property=prop, status=Unit.STATUS_MAINTENANCE, base_rent=Decimal("10000"))

    def test_summary_returns_correct_counts(self):
        resp = self.client.get("/api/payments/dashboard/summary/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["total_units"], 3)
        self.assertEqual(resp.data["occupied_units"], 1)
        self.assertEqual(resp.data["vacant_units"], 1)
        self.assertEqual(resp.data["maintenance_units"], 1)
        self.assertEqual(Decimal(resp.data["vacancy_revenue_loss"]), Decimal("15000.00"))
        self.assertAlmostEqual(resp.data["occupancy_rate"], 33.3, places=0)


# ─── Invoices ─────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestInvoiceEndpoints(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.client = auth_client(self.landlord)
        prop = PropertyFactory(landlord=self.landlord)
        unit = UnitFactory(property=prop)
        self.tenancy = TenancyFactory(unit=unit)
        self.invoice = InvoiceFactory(tenancy=self.tenancy)

    def test_landlord_can_list_invoices(self):
        resp = self.client.get("/api/payments/invoices/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_other_landlord_cannot_see_invoice(self):
        other = LandlordFactory()
        client = auth_client(other)
        resp = client.get("/api/payments/invoices/")
        self.assertEqual(resp.data["count"], 0)


# ─── Tenant Checkout Initialization ───────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionInitializeEndpoint(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.property = PropertyFactory(landlord=self.landlord)
        self.unit = UnitFactory(property=self.property)
        self.tenancy = TenancyFactory(unit=self.unit)
        self.invoice = InvoiceFactory(
            tenancy=self.tenancy,
            amount_due=Decimal("25000"),
            amount_paid=Decimal("0"),
            status=Invoice.STATUS_PENDING,
        )
        self.tenant_client = auth_client(self.tenancy.tenant.user)
        self.landlord_client = auth_client(self.landlord)

        PaystackSubaccountFactory(
            landlord=self.landlord,
            subaccount_code="ACCT_test123",
            is_active=True,
        )

    @patch("apps.payments.views.PaystackAPIClient.initialize_transaction")
    def test_tenant_can_initialize_payment(self, mock_initialize):
        mock_initialize.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/abc123",
                "access_code": "abc123",
                "reference": "rent_ref_1",
            },
        }

        resp = self.tenant_client.post(
            "/api/payments/transactions/initialize/",
            {"invoice_id": self.invoice.pk},
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("authorization_url", resp.data)
        self.assertEqual(resp.data["invoice_id"], self.invoice.pk)
        mock_initialize.assert_called_once()

    @patch("apps.payments.views.PaystackAPIClient.initialize_transaction")
    def test_tenant_cannot_initialize_other_tenants_invoice(self, mock_initialize):
        other_tenancy = TenancyFactory()
        other_invoice = InvoiceFactory(tenancy=other_tenancy, status=Invoice.STATUS_PENDING)

        resp = self.tenant_client.post(
            "/api/payments/transactions/initialize/",
            {"invoice_id": other_invoice.pk},
            format="json",
        )

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        mock_initialize.assert_not_called()

    def test_landlord_cannot_initialize_from_tenant_endpoint(self):
        resp = self.landlord_client.post(
            "/api/payments/transactions/initialize/",
            {"invoice_id": self.invoice.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ─── Transactions ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestTransactionEndpoints(TestCase):
    def setUp(self):
        self.landlord = LandlordFactory()
        self.other_landlord = LandlordFactory()

        self.property = PropertyFactory(landlord=self.landlord)
        self.unit = UnitFactory(property=self.property)
        self.tenancy = TenancyFactory(unit=self.unit)
        self.invoice = InvoiceFactory(tenancy=self.tenancy, status=Invoice.STATUS_PENDING)
        self.txn = TransactionFactory(tenancy=self.tenancy, invoice=self.invoice)

        other_property = PropertyFactory(landlord=self.other_landlord)
        other_unit = UnitFactory(property=other_property)
        other_tenancy = TenancyFactory(unit=other_unit)
        other_invoice = InvoiceFactory(tenancy=other_tenancy, status=Invoice.STATUS_PENDING)
        TransactionFactory(tenancy=other_tenancy, invoice=other_invoice)

        self.tenant_client = auth_client(self.tenancy.tenant.user)
        self.landlord_client = auth_client(self.landlord)

    def test_tenant_lists_only_own_transactions(self):
        resp = self.tenant_client.get("/api/payments/transactions/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)

    def test_landlord_can_filter_transactions_by_invoice(self):
        resp = self.landlord_client.get(
            f"/api/payments/transactions/?invoice={self.invoice.pk}"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["invoice"], self.invoice.pk)


# ─── Webhook ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestWebhookEndpoint(TestCase):
    def setUp(self):
        self.tenancy = TenancyFactory()
        self.invoice = InvoiceFactory(
            tenancy=self.tenancy,
            amount_due=Decimal("25000"),
            amount_paid=Decimal("0"),
        )

    def _post_webhook(self, payload_data: dict):
        raw, sig = make_webhook_payload(payload_data)
        return self.client.generic(
            "POST",
            "/api/payments/webhook/paystack/",
            data=raw,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )

    def test_valid_webhook_returns_200(self):
        resp = self._post_webhook({
            "id": 1,
            "reference": "valid_ref_001",
            "amount": 2500000,
            "currency": "KES",
            "channel": "mobile_money",
            "customer": {"email": "t@t.com", "first_name": "A", "last_name": "B"},
            "metadata": {"tenancy_id": self.tenancy.pk, "invoice_id": self.invoice.pk},
        })
        self.assertEqual(resp.status_code, 200)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.STATUS_PAID)

    def test_invalid_signature_returns_400(self):
        raw = b'{"event":"charge.success","data":{}}'
        resp = self.client.generic(
            "POST",
            "/api/payments/webhook/paystack/",
            data=raw,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="bad_signature",
        )
        self.assertEqual(resp.status_code, 400)

    def test_orphaned_webhook_creates_orphan_record(self):
        resp = self._post_webhook({
            "id": 2,
            "reference": "orphan_ref_001",
            "amount": 1000000,
            "currency": "KES",
            "channel": "card",
            "customer": {"email": "mystery@t.com", "first_name": "", "last_name": ""},
            "metadata": {},  # No tenancy_id
        })
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(OrphanedTransaction.objects.filter(paystack_reference="orphan_ref_001").exists())


# ─── Orphan Resolution ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestOrphanResolutionEndpoint(TestCase):
    def setUp(self):
        self.admin = AdminFactory()
        self.admin_client = auth_client(self.admin)
        self.tenancy = TenancyFactory()
        self.invoice = InvoiceFactory(
            tenancy=self.tenancy,
            amount_due=Decimal("10000"),
            amount_paid=Decimal("0"),
        )
        self.orphan = OrphanFactory(amount=Decimal("10000"))

    def test_admin_can_resolve_orphan(self):
        resp = self.admin_client.post(
            f"/api/payments/orphans/{self.orphan.pk}/resolve/",
            {"tenancy_id": self.tenancy.pk, "resolution_notes": "Verified."},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.orphan.refresh_from_db()
        self.assertEqual(self.orphan.status, OrphanedTransaction.STATUS_RESOLVED)

    def test_non_admin_cannot_resolve(self):
        landlord = LandlordFactory()
        client = auth_client(landlord)
        resp = client.post(
            f"/api/payments/orphans/{self.orphan.pk}/resolve/",
            {"tenancy_id": self.tenancy.pk},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

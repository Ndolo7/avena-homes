# Avena Homes — Onboarding Guide

This document describes the full onboarding flow for new landlords and their tenants on the Avena Homes platform.

---

## Overview

Avena Homes follows a 5-step onboarding flow:

```
Register → Verify → Add Property → Add Units → Onboard Tenants → Collect Rent
```

---

## Step 1: Landlord Registration (`/get-started`)

A new landlord visits the landing page and clicks **"Get started free"**.

They are taken to `/get-started` where they fill in:
- First & last name
- Email address
- Password (min. 8 characters)

On submit, the frontend calls:
```
POST /api/accounts/register/
{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "password": "...",
  "role": "landlord"
}
```

On success, a success screen is shown and the user is redirected to `/login` after 2.5 seconds.

> **Backend:** `CustomUser` is created with `role = "landlord"`. No email verification is currently required (can be added for production).

---

## Step 2: Login (`/login`)

The landlord signs in with their email and password.

```
POST /api/auth/token/
{ "email": "...", "password": "..." }
→ { "access": "...", "refresh": "..." }
```

The frontend:
1. Stores `access_token` and `refresh_token` in `localStorage`
2. Stores `access_token` as a cookie (for server-side RSC auth)
3. Derives a display name from the email and stores it as `user_display_name`
4. Redirects to `/dashboard` (or the `?next=` redirect parameter)

> **Auth guard:** A Next.js Edge middleware at `middleware.ts` protects all `/dashboard/*` routes. If the `access_token` cookie is absent, the user is redirected to `/login?next=<path>`.

---

## Step 3: Add a Property (`/dashboard/properties/new`)

From the Properties page, the landlord clicks **"Add Property"** and fills in:
- Property name (e.g. "Sunrise Apartments")
- Street address
- County (dropdown of all 47 Kenya counties)
- Description

```
POST /api/properties/
{ "name": "...", "address": "...", "county": "...", "description": "..." }
```

On success, the landlord is redirected to the property detail page.

> **Payment subaccount:** In production, a Paystack subaccount is created per landlord (not per property). This happens at landlord onboarding or when the first payment is initiated. The `PaystackSubaccount` model links to the landlord's `CustomUser`.

---

## Step 4: Add Units (`/dashboard/properties/[id]/units/new`)

From the property detail page, the landlord clicks **"Add Unit"** for each rentable space.

Fields:
- Unit number (e.g. "A1", "101", "GF-01")
- Bedrooms & bathrooms
- Floor number (optional)
- Size in sqft (optional)
- Base rent (KES/month)
- Status (vacant / occupied / maintenance)

```
POST /api/properties/units/
{ "property": 1, "unit_number": "A1", "bedrooms": 2, "bathrooms": 1,
  "base_rent": "25000", "status": "vacant", ... }
```

Repeat for each unit. The property overview will show live occupancy stats.

---

## Step 5: Onboard a Tenant (`/dashboard/tenants/new`)

The landlord clicks **"Add Tenant"** and fills in:

**Account Details:**
- First & last name
- Email address
- Temporary password (defaults to `Avena@12345!` if left blank)

**KYC Information:**
- Phone number
- National ID
- KRA PIN
- Date of birth

**Emergency Contact:**
- Name & phone number

Under the hood, two API calls are made:

```
1. POST /api/accounts/register/
   { "first_name": "...", "last_name": "...", "email": "...",
     "password": "...", "role": "tenant" }
   → returns { "id": 5, ... }

2. POST /api/tenants/
   { "user": 5, "phone_number": "...", "national_id": "...",
     "kra_pin": "...", "date_of_birth": "...",
     "emergency_contact_name": "...", "emergency_contact_phone": "..." }
```

On success, the landlord is redirected to the tenant detail page.

---

## Step 6: Create a Tenancy (Lease) (`/dashboard/tenants/[id]/tenancy/new`)

From the tenant detail page, the landlord clicks **"Create tenancy"** to assign the tenant to a unit.

Fields:
- Unit (dropdown of vacant units)
- Monthly rent (KES)
- Deposit amount (KES)
- Billing cycle (monthly / quarterly / annual)
- Billing day of month (1–28)
- Move-in date

```
POST /api/tenants/tenancies/
{ "tenant": 3, "unit": 7, "rent_amount": "25000",
  "deposit_amount": "50000", "billing_cycle": "monthly",
  "billing_day": 1, "move_in_date": "2026-04-01" }
```

> **Key rule:** `Tenant` = KYC profile. `Tenancy` = the lease. All invoices and ledger entries reference the `Tenancy`, not the `Tenant` directly.

---

## Step 7: Automatic Invoice Generation

Invoices are **not created manually** in normal operation. The system generates them automatically:

- A Celery periodic task runs daily at midnight
- For each active `Tenancy`, if today is the `billing_day`, a new `Invoice` is created
- The invoice `amount_due` = `tenancy.rent_amount`
- If the tenant has a `credit_balance`, it is applied at invoice generation time

Manual invoices can be created at `/dashboard/invoices/new` for one-off charges.

---

## Step 8: Rent Collection

Tenants pay via:
- **M-Pesa** (mobile money)
- **Visa / Mastercard** (card)
- **Bank transfer / RTGS**

All payments go through the payment gateway. Funds are routed **directly to the landlord's subaccount** — Avena Homes never holds funds (T+1 settlement).

### Webhook Reconciliation Flow

When a payment is received, a webhook fires to:
```
POST /api/payments/webhook/paystack/
```

The `PaystackWebhookService` (in `services.py`) handles 4 cases:

| Case | Condition | Result |
|------|-----------|--------|
| **Exact** | `amount == invoice.balance_due` | `invoice.status = paid` |
| **Partial** | `amount < invoice.balance_due` | `invoice.status = partial`, invoice stays open |
| **Overpayment** | `amount > invoice.balance_due` | Invoice closed, `tenancy.credit_balance += excess` |
| **Orphaned** | No matching invoice found | `OrphanedTransaction` created for admin review |

Idempotency is enforced via `Transaction.paystack_reference` uniqueness check before any DB writes.

---

## Step 9: Reconciliation Queue (`/dashboard/payments/reconciliation`)

Orphaned payments (unmatched) appear in the admin reconciliation queue. The admin can:
- **Resolve**: Manually link to a tenancy, which creates a ledger credit
- **Dismiss**: Mark as non-actionable (e.g. test transactions)

---

## Data Model Summary

```
CustomUser (role: admin | landlord | tenant)
    └── Property (belongs to landlord)
            └── Unit (status: vacant | occupied | maintenance)
    └── Tenant (KYC profile — 1:1 with CustomUser of role tenant)
            └── Tenancy (lease — links Tenant to Unit)
                    └── Invoice (billing record)
                            └── Transaction (payment record)
                    └── Ledger (audit trail of credits/debits)
    └── PaystackSubaccount (payment routing — 1:1 with landlord)
```

---

## Key URLs

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/get-started` | Landlord registration |
| `/login` | Authentication |
| `/pricing` | Plan comparison |
| `/dashboard` | Main overview |
| `/dashboard/properties` | Property portfolio |
| `/dashboard/properties/new` | Add property |
| `/dashboard/properties/[id]` | Property detail |
| `/dashboard/properties/[id]/units` | Unit management |
| `/dashboard/properties/[id]/units/new` | Add unit |
| `/dashboard/tenants` | Tenant list |
| `/dashboard/tenants/new` | Add tenant |
| `/dashboard/tenants/[id]` | Tenant detail |
| `/dashboard/tenants/[id]/tenancy/new` | Create lease |
| `/dashboard/invoices` | Invoice list |
| `/dashboard/invoices/new` | Manual invoice |
| `/dashboard/invoices/[id]` | Invoice detail |
| `/dashboard/payments/reconciliation` | Orphan queue |
| `/dashboard/settings` | Account settings |
| `/dashboard/profile` | User profile |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
DATABASE_URL=postgres://...
DJANGO_SECRET_KEY=...
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` — the frontend will connect to the backend at `http://localhost:8000`.

---

*Built by Imani Ndolo — Nairobi, Kenya · imanindolo77@gmail.com · +254 745 485 486*

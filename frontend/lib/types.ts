// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "landlord" | "tenant";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

// ── Property & Unit ──────────────────────────────────────────────────────────

export interface Property {
  id: number;
  name: string;
  address: string;
  county: string;
  description: string;
  cover_image: string | null;
  total_units: number;
  occupied_units: number;
  created_at: string;
}

export type UnitStatus = "vacant" | "occupied" | "maintenance";

export interface Unit {
  id: number;
  property: number;
  unit_number: string;
  status: UnitStatus;
  bedrooms: number;
  bathrooms: number;
  size_sqft: string | null;
  floor_number: number | null;
  base_rent: string;
  notes: string;
  created_at: string;
}

// ── Tenant & Tenancy ─────────────────────────────────────────────────────────

export interface Tenant {
  id: number;
  user: User;
  phone_number: string;
  national_id: string;
  kra_pin: string;
  date_of_birth: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export type BillingCycle = "monthly" | "quarterly" | "annual";

/**
 * Tenancy = the *lease*, not the person.
 * All invoices and ledger entries reference this, not Tenant directly.
 */
export interface Tenancy {
  id: number;
  tenant: number;
  unit: number;
  unit_display?: string;
  property_name?: string;
  rent_amount: string;
  deposit_amount: string;
  billing_cycle: BillingCycle;
  billing_day: number;
  move_in_date: string;
  move_out_date: string | null;
  is_active: boolean;
  credit_balance: string;
  created_at: string;
}

// ── Payments ─────────────────────────────────────────────────────────────────

export type InvoiceStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: number;
  invoice_number: string;
  tenancy: number;
  tenancy_display: string;
  amount_due: string;
  amount_paid: string;
  balance_due: string;
  status: InvoiceStatus;
  due_date: string;
  period_start: string;
  period_end: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type TransactionChannel = "card" | "mobile_money" | "bank_transfer";
export type TransactionStatus = "success" | "failed" | "pending";

export interface Transaction {
  id: number;
  invoice: number | null;
  tenancy: number | null;
  paystack_reference: string;
  paystack_id: number | null;
  amount: string;
  currency: string;
  channel: TransactionChannel;
  status: TransactionStatus;
  payer_email: string;
  payer_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type OrphanStatus = "pending" | "resolved" | "dismissed";

export interface OrphanedTransaction {
  id: number;
  paystack_reference: string;
  amount: string;
  currency: string;
  payer_email: string;
  channel: string;
  status: OrphanStatus;
  failure_reason: string;
  raw_payload: Record<string, unknown>;
  resolved_by: number | null;
  resolved_by_display: string | null;
  resolved_at: string | null;
  resolution_notes: string;
  assigned_tenancy: number | null;
  created_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  maintenance_units: number;
  /** Percentage value, e.g. 87.5 */
  occupancy_rate: number;
  pending_invoices_count: number;
  pending_invoices_total: string;
  vacancy_revenue_loss: string;
  orphaned_payments_count: number;
  credit_balance_total: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

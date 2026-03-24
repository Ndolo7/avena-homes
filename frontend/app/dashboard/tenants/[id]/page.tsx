import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Tenant, Tenancy, Invoice, PaginatedResponse } from "@/lib/types";
import TenantActions from "./TenantActions";
import TerminateLeaseAction from "./TerminateLeaseAction";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function headers(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchTenant(id: string, token: string | null): Promise<Tenant | null> {
  try {
    const res = await fetch(`${API_BASE}/tenants/tenants/${id}/`, { headers: headers(token), cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchTenancies(tenantId: string, token: string | null): Promise<Tenancy[]> {
  try {
    const res = await fetch(`${API_BASE}/tenants/tenancies/?tenant=${tenantId}&page_size=20`, { headers: headers(token), cache: "no-store" });
    if (!res.ok) return [];
    const data: PaginatedResponse<Tenancy> = await res.json();
    return data.results;
  } catch { return []; }
}

async function fetchRecentInvoices(tenantId: string, token: string | null): Promise<Invoice[]> {
  try {
    const res = await fetch(`${API_BASE}/payments/invoices/?tenant=${tenantId}&page_size=10`, { headers: headers(token), cache: "no-store" });
    if (!res.ok) return [];
    const data: PaginatedResponse<Invoice> = await res.json();
    return data.results;
  } catch { return []; }
}

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  partial: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  pending: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  overdue: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  cancelled: "bg-slate-100 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700",
};

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [tenant, tenancies, invoices] = await Promise.all([
    fetchTenant(id, token),
    fetchTenancies(id, token),
    fetchRecentInvoices(id, token),
  ]);

  if (!tenant) notFound();

  const activeTenancy = tenancies.find((t) => t.is_active);
  const fullName = `${tenant.user.first_name} ${tenant.user.last_name}`;
  const initials = `${tenant.user.first_name.charAt(0)}${tenant.user.last_name.charAt(0)}`.toUpperCase();

  const avatarColors = ["from-emerald-400 to-teal-500", "from-violet-400 to-purple-500", "from-blue-400 to-indigo-500", "from-rose-400 to-pink-500"];
  const avatarColor = avatarColors[tenant.id % avatarColors.length];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/tenants" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Tenants</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-900 dark:text-white font-medium">{fullName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{fullName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tenant.user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {activeTenancy ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Active tenancy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                    No active lease
                  </span>
                )}
              </div>
            </div>
          </div>
          <TenantActions tenantId={tenant.id} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left col — details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Contact */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Contact</h2>
            {[
              { label: "Phone", value: tenant.phone_number || "—" },
              { label: "Email", value: tenant.user.email },
              { label: "National ID", value: tenant.national_id || "—" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                <span className="font-medium text-slate-900 dark:text-white">{row.value}</span>
              </div>
            ))}
          </div>

          {/* Emergency contact */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Emergency Contact</h2>
            {[
              { label: "Name", value: tenant.emergency_contact_name || "—" },
              { label: "Phone", value: tenant.emergency_contact_phone || "—" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
                <span className="font-medium text-slate-900 dark:text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active tenancy */}
          {activeTenancy ? (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white">Active Lease</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">ID #{activeTenancy.id}</span>
                  <Link href={`/dashboard/tenants/${tenant.id}/tenancy/${activeTenancy.id}/edit`} className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Edit Lease</Link>
                  <TerminateLeaseAction tenancyId={activeTenancy.id} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Unit", value: `#${activeTenancy.unit}` },
                  { label: "Rent", value: `KES ${Number(activeTenancy.rent_amount).toLocaleString()}/mo` },
                  { label: "Deposit", value: `KES ${Number(activeTenancy.deposit_amount).toLocaleString()}` },
                  { label: "Billing day", value: `Day ${activeTenancy.billing_day}` },
                  { label: "Cycle", value: activeTenancy.billing_cycle },
                  { label: "Move-in", value: new Date(activeTenancy.move_in_date).toLocaleDateString("en-KE") },
                ].map((row) => (
                  <div key={row.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{row.label}</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{row.value}</p>
                  </div>
                ))}
              </div>
              {Number(activeTenancy.credit_balance) > 0 && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  Credit balance: KES {Number(activeTenancy.credit_balance).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Lease</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No active tenancy. Assign this tenant to a unit to create a lease.</p>
              <Link
                href={`/dashboard/tenants/${tenant.id}/tenancy/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Create tenancy
              </Link>
            </div>
          )}

          {/* Recent invoices */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">Recent Invoices</h2>
              <Link href="/dashboard/invoices" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all</Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No invoices yet.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.invoice_number}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(inv.due_date).toLocaleDateString("en-KE")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                        KES {Number(inv.amount_due).toLocaleString()}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyles[inv.status] ?? ""}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past tenancies */}
          {tenancies.filter((t) => !t.is_active).length > 0 && (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Past Tenancies</h2>
              <div className="space-y-2">
                {tenancies.filter((t) => !t.is_active).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-700/40 last:border-0">
                    <span className="text-slate-600 dark:text-slate-300">Unit #{t.unit}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">
                      {new Date(t.move_in_date).toLocaleDateString("en-KE")} — {t.move_out_date ? new Date(t.move_out_date).toLocaleDateString("en-KE") : "ongoing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

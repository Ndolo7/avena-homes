import { cookies } from "next/headers";
import Link from "next/link";
import OccupancyBar from "@/components/dashboard/OccupancyBar";
import StatsCard from "@/components/dashboard/StatsCard";
import type { DashboardSummary, OrphanedTransaction, Invoice, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("access_token")?.value ?? null;
}

function hdrs(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchSummary(token: string | null): Promise<DashboardSummary | null> {
  try {
    const r = await fetch(`${API_BASE}/payments/dashboard/summary/`, { headers: hdrs(token), cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function fetchOrphans(token: string | null): Promise<OrphanedTransaction[]> {
  try {
    const r = await fetch(`${API_BASE}/payments/orphans/?status=pending&page_size=5`, { headers: hdrs(token), cache: "no-store" });
    if (!r.ok) return [];
    const d: PaginatedResponse<OrphanedTransaction> = await r.json();
    return d.results;
  } catch { return []; }
}

async function fetchRecentInvoices(token: string | null): Promise<Invoice[]> {
  try {
    const r = await fetch(`${API_BASE}/payments/invoices/?page_size=6`, { headers: hdrs(token), cache: "no-store" });
    if (!r.ok) return [];
    const d: PaginatedResponse<Invoice> = await r.json();
    return d.results;
  } catch { return []; }
}

async function fetchOverdueInvoices(token: string | null): Promise<Invoice[]> {
  try {
    const r = await fetch(`${API_BASE}/payments/invoices/?status=overdue&page_size=5`, { headers: hdrs(token), cache: "no-store" });
    if (!r.ok) return [];
    const d: PaginatedResponse<Invoice> = await r.json();
    return d.results;
  } catch { return []; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kes(v: string | number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(v));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  partial: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
  pending: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  overdue: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400",
  cancelled: "bg-slate-100 dark:bg-slate-700 text-slate-400",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const token = await getToken();
  const [summary, orphans, recentInvoices, overdueInvoices] = await Promise.all([
    fetchSummary(token),
    fetchOrphans(token),
    fetchRecentInvoices(token),
    fetchOverdueInvoices(token),
  ]);

  const today = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-9 h-9 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session expired</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Please sign in to access your dashboard.</p>
          <Link
            href="/login"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const vacancyRevenueLoss = Number(summary.vacancy_revenue_loss || 0);

  return (
    <div className="space-y-7">

      {/* ── Greeting bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{today}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            {greeting()}, welcome back 👋
          </h1>
        </div>
        <div className="flex gap-3 self-start sm:self-auto">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add property
          </Link>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View invoices
          </Link>
        </div>
      </div>

      {/* ── Alert banner ────────────────────────────────────────────────── */}
      {orphans.length > 0 && (
        <div className="flex items-start justify-between gap-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                {orphans.length} unreconciled payment{orphans.length > 1 ? "s" : ""} need your attention
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-0.5">
                These transactions could not be automatically matched to a tenancy.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/payments/reconciliation"
            className="shrink-0 text-sm font-semibold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline underline-offset-2 transition-colors whitespace-nowrap"
          >
            Resolve now →
          </Link>
        </div>
      )}

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total properties"
          value={summary.total_properties}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5" />
            </svg>
          }
        />
        <StatsCard
          label="Occupied units"
          value={`${summary.occupied_units} / ${summary.total_units}`}
          sub={`${summary.occupancy_rate}% occupancy`}
          intent="success"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
            </svg>
          }
        />
        <StatsCard
          label="Outstanding balance"
          value={kes(summary.pending_invoices_total)}
          sub={`${summary.pending_invoices_count} open invoices`}
          intent={summary.pending_invoices_count > 0 ? "warning" : "success"}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Unreconciled payments"
          value={summary.orphaned_payments_count}
          sub={orphans.length > 0 ? "Action required" : "All clear"}
          intent={summary.orphaned_payments_count > 0 ? "danger" : "success"}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Left — 2 cols */}
        <div className="xl:col-span-2 space-y-6">

          {/* Occupancy */}
          <OccupancyBar
            occupied={summary.occupied_units}
            vacant={summary.vacant_units}
            maintenance={summary.maintenance_units}
            total={summary.total_units}
            rate={summary.occupancy_rate}
          />

          {/* Vacancy insight */}
          {summary.vacant_units > 0 && (
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5 text-amber-600 dark:text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {summary.vacant_units} vacant unit{summary.vacant_units > 1 ? "s" : ""} — potential monthly revenue gap
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Estimated lost rent: <span className="font-bold text-amber-600 dark:text-amber-400">{kes(vacancyRevenueLoss)}/month</span> (sum of vacant units monthly rent)
                </p>
              </div>
              <Link
                href="/dashboard/properties"
                className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
              >
                Fill units →
              </Link>
            </div>
          )}

          {/* Recent invoices */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="font-semibold text-slate-900 dark:text-white">Recent Invoices</h2>
              <Link
                href="/dashboard/invoices"
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                View all →
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">No invoices yet. They&apos;re generated automatically on billing day.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 text-slate-500 dark:text-slate-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{inv.invoice_number}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Due {fmtDate(inv.due_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[inv.status] ?? ""}`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                        {kes(inv.balance_due)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Add tenant", href: "/dashboard/tenants", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                { label: "Reconcile", href: "/dashboard/payments/reconciliation", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
                { label: "Add property", href: "/dashboard/properties", icon: "M12 4v16m8-8H4" },
                { label: "Settings", href: "/dashboard/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
              ].map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-200 dark:hover:border-emerald-500/20 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-150 text-center"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d={q.icon} />
                  </svg>
                  <span className="text-xs font-medium">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right — 1 col */}
        <div className="space-y-6">

          {/* Credit pool card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <p className="text-emerald-100 text-sm font-medium">Credit Pool</p>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-black tabular-nums">{kes(summary.credit_balance_total)}</p>
            <p className="text-emerald-100 text-xs mt-2">Overpayments carried forward across all leases. Applied automatically on next invoice.</p>
          </div>

          {/* Quick stats */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Portfolio snapshot</h2>
            <div className="space-y-3">
              {[
                { label: "Maintenance units", value: summary.maintenance_units, color: "bg-amber-400" },
                { label: "Vacant units", value: summary.vacant_units, color: "bg-slate-300 dark:bg-slate-600" },
                { label: "Active invoices", value: summary.pending_invoices_count, color: "bg-blue-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${row.color}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{row.label}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue invoices */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Overdue
                {overdueInvoices.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400">
                    {overdueInvoices.length}
                  </span>
                )}
              </h2>
              <Link href="/dashboard/invoices?status=overdue" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                View all →
              </Link>
            </div>

            {overdueInvoices.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">All current</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No overdue invoices</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {overdueInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-rose-50/40 dark:hover:bg-rose-500/5 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{inv.invoice_number}</p>
                      <p className="text-xs text-rose-500 dark:text-rose-400">Due {fmtDate(inv.due_date)}</p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 shrink-0 ml-3">
                      {kes(inv.balance_due)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import type { Invoice, InvoiceStatus, PaginatedResponse, User } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

type FilterStatus = InvoiceStatus | "all";

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

function serverHeaders(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchInvoices(
  token: string | null,
  status: FilterStatus,
  page: number,
): Promise<PaginatedResponse<Invoice>> {
  const qs = new URLSearchParams({ page: String(page), page_size: "25" });
  if (status !== "all") qs.set("status", status);
  try {
    const res = await fetch(`${API_BASE}/payments/invoices/?${qs.toString()}`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return { count: 0, next: null, previous: null, results: [] };
    return res.json();
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

async function fetchMe(token: string | null): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/accounts/me/`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKes(value: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(invoice: Invoice): boolean {
  return invoice.status === "overdue" || (
    invoice.status === "pending" && new Date(invoice.due_date) < new Date()
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<InvoiceStatus, string> = {
  paid:      "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  partial:   "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  pending:   "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  overdue:   "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  cancelled: "bg-slate-100 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700",
};

const statusDots: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-500",
  partial: "bg-blue-500",
  pending: "bg-slate-400",
  overdue: "bg-rose-500",
  cancelled: "bg-slate-400",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const filterTabs: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Overdue", value: "overdue" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
];

export default async function InvoicesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const resolvedParams = await searchParams;
  const filterStatus = (resolvedParams.status as FilterStatus) ?? "all";
  const page = parseInt(resolvedParams.page ?? "1", 10);

  const [data, me] = await Promise.all([
    fetchInvoices(token, filterStatus, page),
    fetchMe(token),
  ]);
  const isTenant = me?.role === "tenant";
  const invoices = data.results;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {data.count} invoice{data.count !== 1 ? "s" : ""}
          </p>
        </div>
        {!isTenant && (
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/dashboard/invoices?status=${tab.value}`}
              className={`
                px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
                ${isActive
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center pr-1 shrink-0">
          {data.count} total
        </span>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">No invoices found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {filterStatus === "all"
                ? "Invoices are generated automatically on each tenancy billing day."
                : `No ${filterStatus} invoices at the moment.`}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {invoices.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60">
                <tr>
                  {[
                    { label: "Invoice", align: "left" },
                    { label: "Tenancy", align: "left" },
                    { label: "Period", align: "left" },
                    { label: "Due Date", align: "left" },
                    { label: "Amount Due", align: "right" },
                    { label: "Paid", align: "right" },
                    { label: "Balance", align: "right" },
                    { label: "Status", align: "left" },
                    { label: "", align: "right" },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-${h.align}`}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 bg-white dark:bg-slate-800/40">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                      isOverdue(inv) ? "bg-rose-50/40 dark:bg-rose-500/5" : ""
                    }`}
                  >
                    {/* Invoice number */}
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        {inv.invoice_number}
                      </code>
                    </td>

                    {/* Tenancy */}
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                      {inv.tenancy_display || `Tenancy #${inv.tenancy}`}
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          isOverdue(inv)
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {formatDate(inv.due_date)}
                      </span>
                    </td>

                    {/* Amount due */}
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                      {formatKes(inv.amount_due)}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {Number(inv.amount_paid) > 0 ? formatKes(inv.amount_paid) : "—"}
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      <span
                        className={
                          Number(inv.balance_due) > 0
                            ? "font-bold text-rose-600 dark:text-rose-400"
                            : "text-slate-400 dark:text-slate-500"
                        }
                      >
                        {Number(inv.balance_due) > 0 ? formatKes(inv.balance_due) : "Cleared"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(data.next || data.previous) && (
            <div className="flex justify-between items-center">
              {data.previous ? (
                <Link
                  href={`/dashboard/invoices?status=${filterStatus}&page=${page - 1}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Link>
              ) : <span />}

              <span className="text-xs text-slate-400 dark:text-slate-500">
                Page {page} of {Math.ceil(data.count / 25)}
              </span>

              {data.next ? (
                <Link
                  href={`/dashboard/invoices?status=${filterStatus}&page=${page + 1}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : <span />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

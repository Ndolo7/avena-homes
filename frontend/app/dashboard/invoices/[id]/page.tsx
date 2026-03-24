import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import PayInvoiceButton from "@/components/payments/PayInvoiceButton";
import type { Invoice, Transaction, PaginatedResponse, User } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function hdr(token: string | null): HeadersInit {
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function fetchInvoice(id: string, token: string | null): Promise<Invoice | null> {
  try {
    const r = await fetch(`${API_BASE}/payments/invoices/${id}/`, { headers: hdr(token), cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function fetchTransactions(invoiceId: string, token: string | null): Promise<Transaction[]> {
  try {
    const r = await fetch(`${API_BASE}/payments/transactions/?invoice=${invoiceId}&page_size=50`, { headers: hdr(token), cache: "no-store" });
    if (!r.ok) return [];
    const d: PaginatedResponse<Transaction> = await r.json();
    return d.results;
  } catch { return []; }
}

async function fetchMe(token: string | null): Promise<User | null> {
  try {
    const r = await fetch(`${API_BASE}/accounts/me/`, { headers: hdr(token), cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

function formatKes(v: string | number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(v));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

const statusStyles: Record<string, string> = {
  paid:      "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  partial:   "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  pending:   "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  overdue:   "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  cancelled: "bg-slate-100 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700",
};

const txnStatusStyles: Record<string, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  failed:  "text-rose-600 dark:text-rose-400",
  pending: "text-amber-600 dark:text-amber-400",
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [invoice, transactions, me] = await Promise.all([
    fetchInvoice(id, token),
    fetchTransactions(id, token),
    fetchMe(token),
  ]);
  if (!invoice) notFound();

  const balanceDue = Number(invoice.balance_due);
  const isOverdue = invoice.status === "overdue" || (invoice.status === "pending" && new Date(invoice.due_date) < new Date());
  const canPay = me?.role === "tenant" && balanceDue > 0 && invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/invoices" className="hover:text-slate-700 dark:hover:text-slate-200">Invoices</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-900 dark:text-white font-medium font-mono">{invoice.invoice_number}</span>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <code className="text-lg font-mono font-bold text-slate-900 dark:text-white">{invoice.invoice_number}</code>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyles[invoice.status]}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
              {isOverdue && invoice.status !== "overdue" && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20">Overdue</span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{invoice.tenancy_display || `Tenancy #${invoice.tenancy}`}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{formatKes(invoice.amount_due)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Total due</p>
          </div>
        </div>

        {/* Amounts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Amount Due", value: formatKes(invoice.amount_due), highlight: false },
            { label: "Amount Paid", value: formatKes(invoice.amount_paid), highlight: Number(invoice.amount_paid) > 0 },
            { label: "Balance Due", value: balanceDue > 0 ? formatKes(invoice.balance_due) : "Cleared", highlight: false },
            { label: "Due Date", value: formatDate(invoice.due_date), highlight: false },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{s.label}</p>
              <p className={`font-bold text-sm tabular-nums ${s.highlight ? "text-emerald-600 dark:text-emerald-400" : balanceDue > 0 && s.label === "Balance Due" ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {canPay && (
          <div className="mt-5">
            <PayInvoiceButton invoiceId={invoice.id} label={`Pay ${formatKes(invoice.balance_due)}`} />
          </div>
        )}

        {/* Period */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400">
          <span>Period: <span className="text-slate-900 dark:text-white font-medium">{formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}</span></span>
          <span>Created: <span className="text-slate-900 dark:text-white font-medium">{formatDate(invoice.created_at)}</span></span>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h2 className="font-semibold text-slate-900 dark:text-white">Payment History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
                <tr>
                  {["Reference", "Amount", "Channel", "Payer", "Date", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">{t.paystack_reference}</code>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{formatKes(t.amount)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{t.channel.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.payer_name || t.payer_email || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
                    <td className={`px-4 py-3 font-semibold capitalize ${txnStatusStyles[t.status]}`}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">Notes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}

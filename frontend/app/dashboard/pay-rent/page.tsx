import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import PayInvoiceButton from "@/components/payments/PayInvoiceButton";
import type { Invoice, PaginatedResponse, User } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function headers(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchMe(token: string | null): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/accounts/me/`, {
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchInvoices(token: string | null): Promise<Invoice[]> {
  try {
    const res = await fetch(`${API_BASE}/payments/invoices/?page_size=100`, {
      headers: headers(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const payload: PaginatedResponse<Invoice> = await res.json();
    return payload.results;
  } catch {
    return [];
  }
}

function formatKes(value: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PayRentPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;
  if (!token) {
    redirect("/login?next=/dashboard/pay-rent");
  }

  const me = await fetchMe(token);
  if (!me) {
    redirect("/login?next=/dashboard/pay-rent");
  }
  if (me.role !== "tenant") {
    redirect("/dashboard/invoices");
  }

  const invoices = await fetchInvoices(token);
  const openInvoices = invoices
    .filter((inv) => ["pending", "partial", "overdue"].includes(inv.status) && Number(inv.balance_due) > 0)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pay Rent</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {openInvoices.length} outstanding invoice{openInvoices.length === 1 ? "" : "s"} ready for payment.
          </p>
        </div>
        <Link
          href="/dashboard/invoices"
          className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          View all invoices
        </Link>
      </div>

      {openInvoices.length === 0 && (
        <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-500/10 p-6">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">No outstanding balance</p>
          <p className="text-sm text-emerald-700/80 dark:text-emerald-200/80 mt-1">
            You are fully paid up at the moment.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {openInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Due {formatDate(invoice.due_date)} • {invoice.tenancy_display || `Tenancy #${invoice.tenancy}`}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  Balance: {formatKes(invoice.balance_due)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/invoices/${invoice.id}`}
                  className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  View details
                </Link>
                <PayInvoiceButton invoiceId={invoice.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


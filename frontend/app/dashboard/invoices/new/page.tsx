"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Tenancy, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getToken() { return localStorage.getItem("access_token"); }

export default function NewInvoicePage() {
  const router = useRouter();
  const [tenancies, setTenancies] = useState<Tenancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_BASE}/tenants/tenancies/?is_active=true&page_size=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d: PaginatedResponse<Tenancy>) => setTenancies(d.results))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE}/payments/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tenancy: parseInt(fd.get("tenancy") as string),
          amount_due: fd.get("amount_due"),
          due_date: fd.get("due_date"),
          period_start: fd.get("period_start"),
          period_end: fd.get("period_end"),
          notes: fd.get("notes"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? JSON.stringify(d));
      }
      const invoice = await res.json();
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Invoice</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manually create an invoice for a tenancy.</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        Invoices are generated automatically on each billing day. Use this form only for manual or one-off invoices.
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Tenancy */}
        <div>
          <label htmlFor="tenancy" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tenancy <span className="text-rose-500">*</span></label>
          {tenancies.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-2">No active tenancies. <Link href="/dashboard/tenants" className="text-emerald-600 dark:text-emerald-400 hover:underline">Create a tenancy first.</Link></p>
          ) : (
            <select id="tenancy" name="tenancy" required className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors">
              <option value="">Select tenancy...</option>
              {tenancies.map((t) => (
                <option key={t.id} value={t.id}>
                  Tenancy #{t.id} — Unit #{t.unit} — KES {Number(t.rent_amount).toLocaleString()}/mo
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount_due" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount Due (KES) <span className="text-rose-500">*</span></label>
          <input id="amount_due" name="amount_due" type="number" min="0" required placeholder="25000" className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
        </div>

        {/* Dates */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="period_start" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period start <span className="text-rose-500">*</span></label>
            <input id="period_start" name="period_start" type="date" required defaultValue={today} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label htmlFor="period_end" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Period end <span className="text-rose-500">*</span></label>
            <input id="period_end" name="period_end" type="date" required defaultValue={nextMonth} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
          </div>
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Due date <span className="text-rose-500">*</span></label>
          <input id="due_date" name="due_date" type="date" required defaultValue={nextMonth} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
          <textarea id="notes" name="notes" rows={2} placeholder="Optional note about this invoice..." className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/invoices" className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20 flex items-center gap-2">
            {loading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>) : "Create invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

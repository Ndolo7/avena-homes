/**
 * Full Reconciliation Queue page.
 *
 * Shows ALL orphaned transactions (not just the dashboard preview slice).
 * Supports filtering by status: pending | resolved | dismissed | all.
 * Admin users get Resolve / Dismiss action buttons via ReconciliationQueue.
 */
import { cookies } from "next/headers";
import Link from "next/link";

import ReconciliationQueue from "@/components/dashboard/ReconciliationQueue";
import type { OrphanedTransaction, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

type FilterStatus = "pending" | "resolved" | "dismissed" | "all";

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function fetchOrphans(
  token: string | null,
  filterStatus: FilterStatus,
  page: number,
): Promise<PaginatedResponse<OrphanedTransaction>> {
  const qs = new URLSearchParams({ page: String(page) });
  if (filterStatus !== "all") qs.set("status", filterStatus);

  try {
    const res = await fetch(`${API_BASE}/payments/orphans/?${qs.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) return { count: 0, next: null, previous: null, results: [] };
    return res.json();
  } catch {
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function ReconciliationPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const resolvedParams = await searchParams;
  const filterStatus = (resolvedParams.status as FilterStatus) ?? "pending";
  const page = parseInt(resolvedParams.page ?? "1", 10);

  const data = await fetchOrphans(token, filterStatus, page);

  const filterTabs: { label: string; value: FilterStatus; dot?: string }[] = [
    { label: "Pending", value: "pending", dot: "bg-amber-400" },
    { label: "Resolved", value: "resolved", dot: "bg-emerald-400" },
    { label: "Dismissed", value: "dismissed", dot: "bg-slate-400" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2">
          <Link
            href="/dashboard"
            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Dashboard
          </Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 dark:text-slate-300">Reconciliation Queue</span>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reconciliation Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Payments that could not be automatically matched to a tenancy. Assign each to
          the correct tenancy to update the ledger.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/60">
        {filterTabs.map((tab) => {
          const isActive = filterStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/dashboard/payments/reconciliation?status=${tab.value}`}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${
                  isActive
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }
              `}
            >
              {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
              {tab.label}
            </Link>
          );
        })}

        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center pr-1">
          {data.count} total
        </span>
      </div>

      {/* Queue table */}
      <ReconciliationQueue orphans={data.results} isAdmin={true} />

      {/* Pagination */}
      {(data.next || data.previous) && (
        <div className="flex justify-between items-center pt-2">
          {data.previous ? (
            <Link
              href={`/dashboard/payments/reconciliation?status=${filterStatus}&page=${page - 1}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">Page {page}</span>
          {data.next ? (
            <Link
              href={`/dashboard/payments/reconciliation?status=${filterStatus}&page=${page + 1}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import type { OrphanedTransaction } from "@/lib/types";
import { orphansApi } from "@/lib/api";

interface ReconciliationQueueProps {
  orphans: OrphanedTransaction[];
  isAdmin: boolean;
}

const channelLabels: Record<string, string> = {
  card: "Card",
  mobile_money: "M-Pesa",
  bank_transfer: "Bank Transfer",
};

function formatKes(amount: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Resolve Modal ─────────────────────────────────────────────────────────────

function ResolveModal({
  orphan,
  onClose,
  onResolved,
}: {
  orphan: OrphanedTransaction;
  onClose: () => void;
  onResolved: (id: number) => void;
}) {
  const [tenancyId, setTenancyId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(tenancyId, 10);
    if (!parsed || isNaN(parsed)) {
      setError("Please enter a valid Tenancy ID.");
      return;
    }
    startTransition(async () => {
      try {
        await orphansApi.resolve(orphan.id, {
          tenancy_id: parsed,
          resolution_notes: notes,
        });
        onResolved(orphan.id);
        onClose();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Resolution failed.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Resolve Orphaned Payment
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign{" "}
            <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
              {orphan.paystack_reference}
            </code>{" "}
            ({formatKes(orphan.amount)}) to a tenancy.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="tenancy_id"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Target Tenancy ID
            </label>
            <input
              id="tenancy_id"
              type="number"
              min={1}
              value={tenancyId}
              onChange={(e) => setTenancyId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="e.g. 42"
              required
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Resolution Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
              placeholder="Reason for manual assignment..."
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending && (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isPending ? "Resolving..." : "Confirm Resolution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ReconciliationQueue({
  orphans: initialOrphans,
  isAdmin,
}: ReconciliationQueueProps) {
  const [orphans, setOrphans] = useState(initialOrphans);
  const [resolving, setResolving] = useState<OrphanedTransaction | null>(null);
  const [dismissing, setDismissing] = useState<number | null>(null);
  const [dismissNotes, setDismissNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const removeFromQueue = (id: number) =>
    setOrphans((prev) => prev.filter((o) => o.id !== id));

  const handleDismiss = (orphan: OrphanedTransaction) => {
    if (!dismissNotes.trim()) return;
    startTransition(async () => {
      await orphansApi.dismiss(orphan.id, { resolution_notes: dismissNotes });
      removeFromQueue(orphan.id);
      setDismissing(null);
      setDismissNotes("");
    });
  };

  if (orphans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-7 h-7 text-emerald-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">All payments reconciled</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          No orphaned transactions pending review.
        </p>
      </div>
    );
  }

  return (
    <>
      {resolving && (
        <ResolveModal
          orphan={resolving}
          onClose={() => setResolving(null)}
          onResolved={removeFromQueue}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60">
            <tr>
              {["Reference", "Amount", "Channel", "Payer", "Reason", "Received"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    h === "Amount" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
              {isAdmin && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 bg-white dark:bg-slate-800/40">
            {orphans.map((orphan) => (
              <tr
                key={orphan.id}
                className="hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <code className="text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                    {orphan.paystack_reference}
                  </code>
                </td>

                <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatKes(orphan.amount)}
                </td>

                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    {channelLabels[orphan.channel] ?? orphan.channel}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                  {orphan.payer_email || "—"}
                </td>

                <td className="px-4 py-3 max-w-[200px]">
                  <span className="text-xs text-amber-700 dark:text-amber-400 line-clamp-2 leading-relaxed">
                    {orphan.failure_reason}
                  </span>
                </td>

                <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">
                  {formatDate(orphan.created_at)}
                </td>

                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {orphan.status === "pending" ? (
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setResolving(orphan)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          Resolve
                        </button>

                        {dismissing === orphan.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={dismissNotes}
                              onChange={(e) => setDismissNotes(e.target.value)}
                              placeholder="Dismissal reason..."
                              className="text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                            <button
                              onClick={() => handleDismiss(orphan)}
                              disabled={!dismissNotes.trim() || isPending}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 dark:bg-slate-600 text-white disabled:opacity-50 transition-colors"
                            >
                              OK
                            </button>
                            <button
                              onClick={() => {
                                setDismissing(null);
                                setDismissNotes("");
                              }}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDismissing(orphan.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500 capitalize">
                        {orphan.status}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export default function TerminateLeaseAction({ tenancyId }: { tenancyId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0]);

  const handleTerminate = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE}/tenants/tenancies/${tenancyId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: false, move_out_date: moveOutDate }),
      });
      if (res.ok) {
        setShowConfirm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
      >
        Terminate Lease
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Terminate Lease</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This will mark the lease as inactive and render the unit vacant. Please provide the move-out date.
            </p>
            <div className="mb-5">
              <label htmlFor="move_out_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Move-Out Date</label>
              <input
                id="move_out_date"
                type="date"
                required
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={loading || !moveOutDate}
                className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl transition-colors"
              >
                {loading ? "Processing..." : "Terminate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

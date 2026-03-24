"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UnitStatus } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export default function UnitActions({
  unitId,
  propertyId,
  currentStatus,
}: {
  unitId: number;
  propertyId: string;
  currentStatus: UnitStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const cycleStatus = async () => {
    const next: UnitStatus =
      currentStatus === "vacant" ? "maintenance" :
      currentStatus === "maintenance" ? "vacant" : "vacant";
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${API_BASE}/properties/units/${unitId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      await fetch(`${API_BASE}/properties/units/${unitId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.refresh();
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {currentStatus !== "occupied" && (
          <button
            onClick={cycleStatus}
            disabled={loading}
            className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {currentStatus === "vacant" ? "Mark maintenance" : "Mark vacant"}
          </button>
        )}
        <Link
          href={`/dashboard/properties/${propertyId}/units/${unitId}/edit`}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          title="Edit Unit"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          title="Delete Unit"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Delete Unit?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">This will permanently delete the unit. Active tenancies on this unit may be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white rounded-xl transition-colors">{loading ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

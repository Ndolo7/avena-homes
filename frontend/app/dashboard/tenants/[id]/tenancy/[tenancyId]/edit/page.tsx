"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Unit, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("access_token");
}

export default function EditTenancyPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const tenancyId = params.tenancyId as string;
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tData, setTData] = useState<Record<string, any>>({});
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  useEffect(() => {
    const token = getToken();
    
    Promise.all([
      fetch(`${API_BASE}/tenants/tenancies/${tenancyId}/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      }),
      fetch(`${API_BASE}/properties/units/?page_size=200`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([tenancyData, unitsData]) => {
      setTData(tenancyData);
      setRentAmount(tenancyData.rent_amount);
      setDepositAmount(tenancyData.deposit_amount);
      setSelectedUnit(String(tenancyData.unit));
      
      const allUnits: Unit[] = unitsData.results || [];
      const available = allUnits.filter(u => u.status === "vacant" || Number(u.id) === Number(tenancyData.unit));
      setUnits(available);
      
      setInitialLoading(false);
    }).catch(err => {
      setError(err instanceof Error ? err.message : "Failed to load lease details");
      setInitialLoading(false);
    });
  }, [tenancyId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE}/tenants/tenancies/${tenancyId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          unit: parseInt(selectedUnit),
          rent_amount: rentAmount,
          deposit_amount: depositAmount,
          billing_cycle: fd.get("billing_cycle"),
          billing_day: parseInt(fd.get("billing_day") as string),
          move_in_date: fd.get("move_in_date"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? JSON.stringify(d));
      }
      router.push(`/dashboard/tenants/${tenantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lease.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedUnit(val);
    const found = units.find(u => String(u.id) === val);
    if (found?.base_rent) {
      setRentAmount(String(found.base_rent));
      setDepositAmount(String(found.base_rent));
    }
  };

  if (initialLoading) {
    return <div className="p-8 text-slate-500">Loading lease details...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/tenants/${tenantId}`} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Lease</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update lease terms or change units.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Unit <span className="text-rose-500">*</span>
          </label>
          {units.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-2">No vacant units available. <Link href="/dashboard/properties" className="text-emerald-600 dark:text-emerald-400 hover:underline">Add a property first.</Link></p>
          ) : (
            <select
              id="unit" name="unit" required value={selectedUnit} onChange={handleUnitChange}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            >
              <option value="">Select a unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Unit {u.unit_number} — KES {Number(u.base_rent).toLocaleString()}/mo</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rent_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monthly rent (KES) <span className="text-rose-500">*</span></label>
            <input id="rent_amount" name="rent_amount" type="number" required value={rentAmount} onChange={(e) => setRentAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label htmlFor="deposit_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deposit (KES) <span className="text-rose-500">*</span></label>
            <input id="deposit_amount" name="deposit_amount" type="number" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="billing_cycle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Billing cycle</label>
            <select id="billing_cycle" name="billing_cycle" required defaultValue={tData.billing_cycle || "monthly"} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <label htmlFor="billing_day" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Billing day of month</label>
            <input id="billing_day" name="billing_day" type="number" min="1" max="28" required defaultValue={tData.billing_day || 1} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label htmlFor="move_in_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Move-in date <span className="text-rose-500">*</span></label>
          <input id="move_in_date" name="move_in_date" type="date" required defaultValue={tData.move_in_date}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()} onFocus={(e) => (e.target as HTMLInputElement).showPicker()}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer" />
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href={`/dashboard/tenants/${tenantId}`} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

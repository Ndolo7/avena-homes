"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function Field({ label, id, type = "text", required, placeholder, min, max }: {
  label: string; id: string; type?: string; required?: boolean; placeholder?: string; min?: string; max?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={id} name={id} type={type} required={required} placeholder={placeholder} min={min} max={max}
        className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}

export default function NewUnitPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const token = localStorage.getItem("access_token");

    const body: Record<string, unknown> = {
      property: parseInt(propertyId),
      bedrooms: parseInt(fd.get("bedrooms") as string),
      bathrooms: parseInt(fd.get("bathrooms") as string),
      base_rent: fd.get("base_rent"),
      status: fd.get("status"),
      count: parseInt(fd.get("count") as string),
      prefix: fd.get("prefix") || "",
      start_number: parseInt(fd.get("start_number") as string),
    };

    const floor = fd.get("floor_number") as string;
    if (floor) body.floor_number = parseInt(floor);
    const size = fd.get("size_sqft") as string;
    if (size) body.size_sqft = size;
    const notes = fd.get("notes") as string;
    if (notes) body.notes = notes;

    try {
      const res = await fetch(`${API_BASE}/properties/units/bulk_create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? JSON.stringify(d));
      }
      router.push(`/dashboard/properties/${propertyId}/units`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create units.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/properties/${propertyId}/units`} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Units</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create multiple identical units for this property.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-5">
        
        <div className="grid sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
          <Field label="Prefix (e.g. 'A-', 'Bedsitter ')" id="prefix" />
          <Field label="Starting number" id="start_number" type="number" required placeholder="1" min="1" />
          <Field label="Count to generate" id="count" type="number" required placeholder="10" min="1" max="100" />
          <div className="col-span-full pt-1">
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Initial Status <span className="text-rose-500">*</span></label>
            <select id="status" name="status" required className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors">
              <option value="vacant">Vacant</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Bedrooms" id="bedrooms" type="number" required placeholder="1" min="0" max="20" />
          <Field label="Bathrooms" id="bathrooms" type="number" required placeholder="1" min="0" max="10" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Floor number" id="floor_number" type="number" placeholder="0 = Ground" min="0" />
          <Field label="Size (sqft)" id="size_sqft" type="number" placeholder="650" min="0" />
        </div>

        <Field label="Base rent (KES/month)" id="base_rent" type="number" required placeholder="25000" min="0" />

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
          <textarea id="notes" name="notes" rows={2} placeholder="Any additional notes about this unit..." className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href={`/dashboard/properties/${propertyId}/units`} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20 flex items-center gap-2">
            {loading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>) : "Add units"}
          </button>
        </div>
      </form>
    </div>
  );
}

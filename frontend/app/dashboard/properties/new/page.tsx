"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos",
  "Nyeri", "Meru", "Embu", "Garissa", "Kakamega", "Kisii", "Kitale", "Malindi",
  "Kilifi", "Kwale", "Lamu", "Kajiado", "Kiambu", "Murang'a", "Nyandarua",
  "Kirinyaga", "Laikipia", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet",
  "Nandi", "Baringo", "Kericho", "Bomet", "Narok", "Migori", "Homa Bay",
  "Siaya", "Bungoma", "Busia", "Vihiga", "Tana River", "Isiolo", "Marsabit",
  "Mandera", "Wajir", "Turkana", "West Pokot", "Pokot", "Nyamira", "Taita-Taveta", "Makueni",
];

function Field({
  label, id, type = "text", required, placeholder, hint, element = "input",
}: {
  label: string; id: string; type?: string; required?: boolean; placeholder?: string; hint?: string; element?: "input" | "textarea";
}) {
  const cls = "w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors";
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {element === "textarea" ? (
        <textarea id={id} name={id} required={required} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input id={id} name={id} type={type} required={required} placeholder={placeholder} className={cls} />
      )}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const token = localStorage.getItem("access_token");

    try {
      const res = await fetch(`${API_BASE}/properties/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fd.get("name"),
          address: fd.get("address"),
          county: fd.get("county"),
          description: fd.get("description"),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? JSON.stringify(d));
      }
      const property = await res.json();
      router.push(`/dashboard/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Property</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Register a new rental property in your portfolio.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Property Details</h2>
          <Field label="Property name" id="name" required placeholder="Sunrise Apartments" />
          <Field label="Street address" id="address" required placeholder="123 Ngong Road, Kilimani" />
          <div>
            <label htmlFor="county" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              County <span className="text-rose-500">*</span>
            </label>
            <select id="county" name="county" required className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors">
              <option value="">Select county...</option>
              {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Description" id="description" element="textarea" placeholder="Brief description of the property — building type, amenities, location notes..." />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400">
          After creating the property, you&apos;ll be able to add individual units with rent amounts, bedroom counts, and more.
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/dashboard/properties" className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20 flex items-center gap-2">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
            ) : "Create property"}
          </button>
        </div>
      </form>
    </div>
  );
}

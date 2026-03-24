"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function Field({
  label,
  id,
  type = "text",
  required,
  placeholder,
  hint,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
      />
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const token = getToken();

    try {
      // Single atomic call — backend creates user + tenant in one transaction.
      const res = await fetch(`${API_BASE}/tenants/onboard/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: fd.get("first_name"),
          last_name: fd.get("last_name"),
          email: fd.get("email"),
          password: fd.get("password") || "Avena@12345!",
          phone_number: fd.get("phone_number"),
          national_id: fd.get("national_id"),
          emergency_contact_name: fd.get("emergency_contact_name"),
          emergency_contact_phone: fd.get("emergency_contact_phone"),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // Flatten DRF field-level errors (e.g. {"email": ["..."], "national_id": ["..."]})
        const fieldErrors = Object.entries(d)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join(" | ");
        throw new Error(fieldErrors || d.detail || "Failed to create tenant.");
      }

      const tenant = await res.json();
      router.push(`/dashboard/tenants/${tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/tenants"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Tenant</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create a tenant account and profile.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account info */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Account Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" id="first_name" required placeholder="John" />
            <Field label="Last name" id="last_name" required placeholder="Kamau" />
          </div>
          <Field label="Email address" id="email" type="email" required placeholder="tenant@example.com" hint="A login account will be created with this email." />
          <Field label="Temporary password" id="password" type="password" placeholder="Leave blank to use default (Avena@12345!)" hint="Tenant should change this on first login." />
        </div>

        {/* KYC info */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">KYC Information</h2>
          <Field label="Phone number" id="phone_number" type="tel" required placeholder="+254 7XX XXX XXX" />
          <Field label="National ID" id="national_id" required placeholder="12345678" />
        </div>

        {/* Emergency contact */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Emergency Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact name" id="emergency_contact_name" placeholder="Jane Kamau" />
            <Field label="Contact phone" id="emergency_contact_phone" type="tel" placeholder="+254 7XX XXX XXX" />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard/tenants"
            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create tenant"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

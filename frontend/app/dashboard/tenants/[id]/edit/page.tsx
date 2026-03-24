"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function Field({ label, id, type = "text", required, placeholder, value, onChange }: {
  label: string; id: string; type?: string; required?: boolean; placeholder?: string;
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        id={id} name={id} type={type} required={required} placeholder={placeholder}
        value={value || ""} onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tData, setTData] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/tenants/tenants/${tenantId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load tenant details");
        const data = await res.json();
        setTData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading tenant");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const token = localStorage.getItem("access_token");

    const body = {
      user: {
        first_name: fd.get("first_name"),
        last_name: fd.get("last_name"),
        email: fd.get("email"),
      },
      phone_number: fd.get("phone_number"),
      national_id: fd.get("national_id"),
      kra_pin: fd.get("kra_pin"),
      date_of_birth: fd.get("date_of_birth") || null,
      emergency_contact_name: fd.get("emergency_contact_name"),
      emergency_contact_phone: fd.get("emergency_contact_phone"),
      notes: fd.get("notes"),
    };

    try {
      const res = await fetch(`${API_BASE}/tenants/tenants/${tenantId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? JSON.stringify(d));
      }
      router.push(`/dashboard/tenants/${tenantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tenant.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTData(prev => ({
      ...prev,
      user: { ...prev.user, [e.target.name]: e.target.value }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (initialLoading) {
    return <div className="p-8 text-slate-500">Loading tenant details...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/tenants/${tenantId}`} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update details for {tData.full_name}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Personal Info</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" id="first_name" required value={tData.user?.first_name} onChange={handleUserChange} />
            <Field label="Last name" id="last_name" required value={tData.user?.last_name} onChange={handleUserChange} />
          </div>
          <Field label="Email address" id="email" type="email" required value={tData.user?.email} onChange={handleUserChange} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Phone number" id="phone_number" required value={tData.phone_number} onChange={handleChange} />
            <Field label="National ID" id="national_id" required value={tData.national_id} onChange={handleChange} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date of birth" id="date_of_birth" type="date" value={tData.date_of_birth} onChange={handleChange} />
            <Field label="KRA PIN" id="kra_pin" placeholder="Optional" value={tData.kra_pin} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Emergency Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Contact name" id="emergency_contact_name" value={tData.emergency_contact_name} onChange={handleChange} />
            <Field label="Contact phone" id="emergency_contact_phone" value={tData.emergency_contact_phone} onChange={handleChange} />
          </div>
        </div>

        <div className="pt-2">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
          <textarea id="notes" name="notes" rows={2} value={tData.notes || ""} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors" />
        </div>

        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href={`/dashboard/tenants/${tenantId}`} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</Link>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md hover:shadow-emerald-500/20 flex items-center gap-2">
            {loading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>) : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

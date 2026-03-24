import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Property, Unit, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function hdr(token: string | null): HeadersInit {
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function fetchProperty(id: string, token: string | null): Promise<Property | null> {
  try {
    const r = await fetch(`${API_BASE}/properties/${id}/`, { headers: hdr(token), cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function fetchUnits(id: string, token: string | null): Promise<Unit[]> {
  try {
    const r = await fetch(`${API_BASE}/properties/units/?property=${id}&page_size=200`, { headers: hdr(token), cache: "no-store" });
    if (!r.ok) return [];
    const d: PaginatedResponse<Unit> = await r.json();
    return d.results;
  } catch { return []; }
}

const statusStyle: Record<string, string> = {
  occupied:    "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  vacant:      "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  maintenance: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [property, units] = await Promise.all([fetchProperty(id, token), fetchUnits(id, token)]);
  if (!property) notFound();

  const pct = property.total_units > 0 ? Math.round((property.occupied_units / property.total_units) * 100) : 0;
  const vacant = property.total_units - property.occupied_units;
  const maintenance = units.filter((u) => u.status === "maintenance").length;
  const coverUrl = property.cover_image ?? `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=70&auto=format&fit=crop`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/properties" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Properties</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-900 dark:text-white font-medium">{property.name}</span>
      </div>

      {/* Cover + header */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="relative h-48 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{property.name}</h1>
              <p className="text-slate-300 text-sm">{property.address} · {property.county}</p>
            </div>
            <Link
              href={`/dashboard/properties/${id}/units/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Unit
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-700/60">
          {[
            { label: "Total Units", value: property.total_units },
            { label: "Occupied", value: property.occupied_units },
            { label: "Vacant", value: vacant },
            { label: "Occupancy", value: `${pct}%` },
          ].map((s) => (
            <div key={s.label} className="px-5 py-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Occupancy</span>
          <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" />{property.occupied_units} Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />{vacant} Vacant</span>
          {maintenance > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-400 rounded-full" />{maintenance} Maintenance</span>}
        </div>
      </div>

      {/* Units table */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h2 className="font-semibold text-slate-900 dark:text-white">Units ({units.length})</h2>
          <Link href={`/dashboard/properties/${id}/units`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Manage units</Link>
        </div>
        {units.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No units yet.</p>
            <Link href={`/dashboard/properties/${id}/units/new`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add first unit
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
                <tr>
                  {["Unit", "Bedrooms", "Bathrooms", "Floor", "Base Rent", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                {units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{u.unit_number}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.bedrooms} bd</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.bathrooms} ba</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.floor_number ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">KES {Number(u.base_rent).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle[u.status]}`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {property.description && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{property.description}</p>
        </div>
      )}
    </div>
  );
}

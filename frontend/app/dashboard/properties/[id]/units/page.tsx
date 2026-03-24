import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Property, Unit, PaginatedResponse } from "@/lib/types";
import UnitActions from "./UnitActions";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";
type UnitFilter = Unit["status"] | "all";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

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

export default async function UnitsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [property, units] = await Promise.all([fetchProperty(id, token), fetchUnits(id, token)]);
  if (!property) notFound();

  const rawStatus = resolvedSearchParams.status;
  const filterStatus: UnitFilter =
    rawStatus === "occupied" || rawStatus === "vacant" || rawStatus === "maintenance"
      ? rawStatus
      : "all";
  const visibleUnits =
    filterStatus === "all"
      ? units
      : units.filter((u) => u.status === filterStatus);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard/properties" className="hover:text-slate-700 dark:hover:text-slate-200">Properties</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <Link href={`/dashboard/properties/${id}`} className="hover:text-slate-700 dark:hover:text-slate-200">{property.name}</Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-slate-900 dark:text-white font-medium">Units</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Units — {property.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {visibleUnits.length} shown of {units.length} units
            {filterStatus !== "all" ? ` · filtered: ${filterStatus}` : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/properties/${id}/units/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Unit
        </Link>
      </div>

      {/* Filters */}
      {units.length > 0 && (
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {[
            { label: "All", value: "all" as UnitFilter },
            { label: "Occupied", value: "occupied" as UnitFilter },
            { label: "Vacant", value: "vacant" as UnitFilter },
            { label: "Maint.", value: "maintenance" as UnitFilter },
          ].map((tab) => {
            const isActive = filterStatus === tab.value;
            const href = tab.value === "all"
              ? `/dashboard/properties/${id}/units`
              : `/dashboard/properties/${id}/units?status=${tab.value}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`
                  px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors
                  ${isActive
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                  }
                `}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">No units yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Add units to this property to start managing occupancy.</p>
          </div>
          <Link href={`/dashboard/properties/${id}/units/new`} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Add first unit
          </Link>
        </div>
      ) : visibleUnits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-200">No units match this filter</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Try another status tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleUnits.map((u) => (
            <div key={u.id} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Unit {u.unit_number}</h3>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle[u.status]}`}>
                  {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                {[
                  { label: "Bedrooms", value: `${u.bedrooms} bd` },
                  { label: "Bathrooms", value: `${u.bathrooms} ba` },
                  { label: "Base Rent", value: `KES ${Number(u.base_rent).toLocaleString()}` },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{r.value}</span>
                  </div>
                ))}
              </div>

              <UnitActions unitId={u.id} propertyId={id} currentStatus={u.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

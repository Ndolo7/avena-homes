import { cookies } from "next/headers";
import Link from "next/link";
import type { Property, Unit, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function serverHeaders(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchProperties(token: string | null): Promise<Property[]> {
  try {
    const res = await fetch(`${API_BASE}/properties/?page_size=100`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: PaginatedResponse<Property> = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

async function fetchUnits(token: string | null): Promise<Unit[]> {
  try {
    const res = await fetch(`${API_BASE}/properties/units/?page_size=500`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: PaginatedResponse<Unit> = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

function occupancyPct(occupied: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((occupied / total) * 100);
}

// ─── Unit status pill ─────────────────────────────────────────────────────────

const unitStatusStyles: Record<string, string> = {
  occupied: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  vacant: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/40",
  maintenance: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
};

// ─── Property card ────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  units,
}: {
  property: Property;
  units: Unit[];
}) {
  const pct = occupancyPct(property.occupied_units, property.total_units);
  const vacant = property.total_units - property.occupied_units;
  const maintenance = units.filter(
    (u) => u.property === property.id && u.status === "maintenance",
  ).length;

  // Deterministic Unsplash image seeded by property id
  const imgId = [
    "photo-1560448204-e02f11c3d0e2",
    "photo-1580587771525-78b9dba3b914",
    "photo-1486325212027-8081e485255e",
    "photo-1545324418-cc1a3fa10c00",
    "photo-1484154218962-a197022b5858",
  ][property.id % 5];
  const coverUrl = property.cover_image ?? `https://images.unsplash.com/${imgId}?w=600&q=70&auto=format&fit=crop`;

  return (
    <div className="group relative bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
      <Link
        href={`/dashboard/properties/${property.id}`}
        aria-label={`Open ${property.name}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
      />

      {/* Cover */}
      <div className="relative h-40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.county}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1 truncate">
          {property.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 truncate">
          {property.address}
        </p>

        {/* Occupancy bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Occupancy</span>
            <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Unit stats */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "Occupied", count: property.occupied_units, style: unitStatusStyles.occupied, status: "occupied" },
            { label: "Vacant", count: vacant, style: unitStatusStyles.vacant, status: "vacant" },
            { label: "Maint.", count: maintenance, style: unitStatusStyles.maintenance, status: "maintenance" },
          ].map((s) => (
            <Link
              key={s.label}
              href={`/dashboard/properties/${property.id}/units?status=${s.status}`}
              className={`relative z-20 flex-1 text-center text-xs font-semibold py-1.5 rounded-lg border hover:brightness-95 dark:hover:brightness-110 transition ${s.style}`}
            >
              {s.count} {s.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/properties/${property.id}`}
            className="relative z-20 flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/dashboard/properties/${property.id}/units`}
            className="relative z-20 flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            {property.total_units} Units
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertiesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [properties, units] = await Promise.all([
    fetchProperties(token),
    fetchUnits(token),
  ]);

  const totalUnits = properties.reduce((s, p) => s + p.total_units, 0);
  const totalOccupied = properties.reduce((s, p) => s + p.occupied_units, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Properties</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} ·{" "}
            {totalUnits} total units · {occupancyPct(totalOccupied, totalUnits)}% occupied
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </Link>
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">No properties yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Add your first property to get started.
            </p>
          </div>
          <Link
            href="/dashboard/properties/new"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Add first property
          </Link>
        </div>
      )}

      {/* Grid */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} units={units} />
          ))}
        </div>
      )}
    </div>
  );
}

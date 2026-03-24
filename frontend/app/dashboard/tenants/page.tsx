import { Fragment } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Tenant, Tenancy, PaginatedResponse } from "@/lib/types";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8000/api";

function serverHeaders(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchTenants(token: string | null): Promise<Tenant[]> {
  try {
    const res = await fetch(`${API_BASE}/tenants/tenants/?page_size=100`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: PaginatedResponse<Tenant> = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

async function fetchTenancies(token: string | null): Promise<Tenancy[]> {
  try {
    const res = await fetch(`${API_BASE}/tenants/tenancies/?page_size=200`, {
      headers: serverHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: PaginatedResponse<Tenancy> = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const avatarColors = [
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-indigo-500",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-sky-500",
];

function avatarColor(id: number): string {
  return avatarColors[id % avatarColors.length];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TenantsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? null;

  const [tenants, tenancies] = await Promise.all([
    fetchTenants(token),
    fetchTenancies(token),
  ]);

  // Build active-tenancy lookup by tenant id
  const activeTenancyByTenant = new Map<number, Tenancy>();
  for (const t of tenancies) {
    if (t.is_active) activeTenancyByTenant.set(t.tenant, t);
  }

  const activeCount = tenants.filter((t) => activeTenancyByTenant.has(t.id)).length;

  const groupedTenants: Record<string, Tenant[]> = {
    "Unassigned": [],
  };

  for (const tenant of tenants) {
    const tenancy = activeTenancyByTenant.get(tenant.id);
    if (!tenancy) {
      groupedTenants["Unassigned"].push(tenant);
      continue;
    }
    const propName = tenancy.property_name || "Unknown Property";
    if (!groupedTenants[propName]) {
      groupedTenants[propName] = [];
    }
    groupedTenants[propName].push(tenant);
  }

  const sortedProperties = Object.keys(groupedTenants).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} · {activeCount} with active lease
          </p>
        </div>
        <Link
          href="/dashboard/tenants/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto shadow-sm hover:shadow-md hover:shadow-emerald-500/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Tenant
        </Link>
      </div>

      {/* Empty state */}
      {tenants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-200">No tenants yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Onboard your first tenant to assign them a unit.
            </p>
          </div>
          <Link
            href="/dashboard/tenants/new"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Add first tenant
          </Link>
        </div>
      )}

      {/* Table */}
      {tenants.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                {["#", "Tenant", "Contact", "National ID", "Lease", "Credit Balance", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 bg-white dark:bg-slate-800/40">
              {sortedProperties.map((prop) => {
                const propTenants = groupedTenants[prop];
                if (propTenants.length === 0) return null;
                
                return (
                  <Fragment key={prop}>
                    <tr>
                      <td colSpan={7} className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/80 text-sm font-semibold text-slate-700 dark:text-slate-300 pointer-events-none">
                        {prop}
                      </td>
                    </tr>
                    {propTenants.map((tenant, index) => {
                      const tenancy = activeTenancyByTenant.get(tenant.id);
                      const credit = tenancy ? parseFloat(tenancy.credit_balance) : 0;
      
                      return (
                        <tr
                          key={tenant.id}
                          className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative"
                        >
                          {/* Numbering */}
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">
                            {index + 1}
                          </td>
      
                          {/* Name + avatar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(tenant.id)} flex items-center justify-center shrink-0`}
                              >
                                <span className="text-white text-xs font-bold">
                                  {initials(tenant.user.first_name, tenant.user.last_name)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <Link href={`/dashboard/tenants/${tenant.id}`} className="font-semibold text-slate-900 dark:text-white truncate hover:underline group-hover:text-emerald-600 dark:group-hover:text-emerald-400 before:absolute before:inset-0">
                                  {tenant.user.first_name} {tenant.user.last_name}
                                </Link>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {tenant.user.email}
                                </p>
                              </div>
                            </div>
                          </td>
      
                          {/* Phone */}
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {tenant.phone_number || "—"}
                          </td>
      
                          {/* National ID */}
                          <td className="px-4 py-3">
                            <code className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                              {tenant.national_id || "—"}
                            </code>
                          </td>
      
                          {/* Tenancy status & Unit Display */}
                          <td className="px-4 py-3">
                            {tenancy ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  Active
                                </span>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  {tenancy.unit_display} · KES {Number(tenancy.rent_amount).toLocaleString()}/mo
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">No active lease</span>
                            )}
                          </td>
      
                          {/* Credit balance */}
                          <td className="px-4 py-3">
                            {credit > 0 ? (
                              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                KES {credit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                            )}
                          </td>
      
                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              View →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

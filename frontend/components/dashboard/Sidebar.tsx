"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthStorage } from "@/lib/auth";

// ─── Icon helper ──────────────────────────────────────────────────────────────

function Icon({ d, d2, className = "w-[22px] h-[22px]" }: { d: string; d2?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  icon: string;
  icon2?: string;
  badge?: string;
};

const landlordNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    exact: true,
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/dashboard/properties",
    label: "Properties",
    exact: false,
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m14 0a2 2 0 01-2 2H7a2 2 0 01-2-2M9 7h6m-6 4h6m-2 4h2",
  },
  {
    href: "/dashboard/tenants",
    label: "Tenants",
    exact: false,
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/dashboard/invoices",
    label: "Invoices",
    exact: false,
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/dashboard/payments/reconciliation",
    label: "Reconciliation",
    exact: false,
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    badge: "!",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    exact: false,
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    icon2: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const tenantNavItems: NavItem[] = [
  {
    href: "/dashboard/pay-rent",
    label: "Pay Rent",
    exact: false,
    icon: "M12 8c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5z",
    icon2: "M3 10h18M3 14h18",
  },
  {
    href: "/dashboard/invoices",
    label: "Invoices",
    exact: false,
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    exact: false,
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    icon2: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("landlord");

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const navItems = useMemo(
    () => (userRole === "tenant" ? tenantNavItems : landlordNavItems),
    [userRole],
  );

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  const content = (
    <div className="flex flex-col h-full">

      {/* Logo row */}
      <div className={`h-14 flex items-center shrink-0 border-b border-slate-200 dark:border-slate-800 px-4 ${collapsed ? "justify-center px-3" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-white font-extrabold text-[1.15rem] leading-none tracking-tight">
              avena<span className="text-emerald-600">homes</span>
            </span>
          </Link>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-150
                ${active
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"}
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-r-full" />
              )}

              <Icon d={item.icon} d2={item.icon2} className="w-[22px] h-[22px] shrink-0" />

              {!collapsed && (
                <>
                  <span className="truncate text-[15px]">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* Collapsed tooltip */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — sign out */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? "Sign out" : undefined}
          className={`
            group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium
            text-slate-500 dark:text-slate-400
            hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400
            transition-all duration-150
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px] shrink-0">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="text-[15px]">Sign out</span>}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Sign out
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden lg:flex flex-col shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-[250ms] ease-in-out overflow-hidden ${collapsed ? "w-[72px]" : "w-64"}`}>
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button
          onClick={onMobileClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {content}
      </aside>
    </>
  );
}

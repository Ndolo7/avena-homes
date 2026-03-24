import type { ReactNode } from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: { value: string; up: boolean };
  intent?: "default" | "success" | "warning" | "danger";
}

const intentMap = {
  default: {
    wrapper: "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60",
    icon: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    value: "text-slate-900 dark:text-white",
    sub: "text-slate-500 dark:text-slate-400",
  },
  success: {
    wrapper: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    icon: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-100",
    sub: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    wrapper: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    icon: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
    value: "text-amber-900 dark:text-amber-100",
    sub: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    wrapper: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    icon: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
    value: "text-rose-900 dark:text-rose-100",
    sub: "text-rose-600 dark:text-rose-400",
  },
};

export default function StatsCard({
  label,
  value,
  sub,
  icon,
  trend,
  intent = "default",
}: StatsCardProps) {
  const styles = intentMap[intent];

  return (
    <div
      className={`
        rounded-2xl border p-5 flex items-start gap-4
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${styles.wrapper}
      `}
    >
      {icon && (
        <div
          className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 opacity-60 truncate ${styles.value}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold tabular-nums leading-none ${styles.value}`}>
          {value}
        </p>
        {(sub || trend) && (
          <div className="mt-1.5 flex items-center gap-2">
            {sub && (
              <p className={`text-xs ${styles.sub}`}>{sub}</p>
            )}
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                  trend.up
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  className={`w-3 h-3 ${trend.up ? "" : "rotate-180"}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {trend.value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

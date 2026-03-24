interface OccupancyBarProps {
  occupied: number;
  vacant: number;
  maintenance: number;
  total: number;
  rate: number;
}

export default function OccupancyBar({
  occupied,
  vacant,
  maintenance,
  total,
  rate,
}: OccupancyBarProps) {
  const occupiedPct = total > 0 ? (occupied / total) * 100 : 0;
  const maintenancePct = total > 0 ? (maintenance / total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Unit Occupancy
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {total} total units
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {rate}%
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">occupied</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex gap-0.5">
        <div
          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-l-full transition-all duration-700"
          style={{ width: `${occupiedPct}%` }}
          title={`Occupied: ${occupied}`}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-700"
          style={{ width: `${maintenancePct}%` }}
          title={`Maintenance: ${maintenance}`}
        />
        {/* Vacant fills remainder via parent bg */}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {[
          {
            color: "bg-emerald-500 dark:bg-emerald-400",
            label: "Occupied",
            count: occupied,
          },
          {
            color: "bg-slate-200 dark:bg-slate-600",
            label: "Vacant",
            count: vacant,
          },
          {
            color: "bg-amber-400",
            label: "Maintenance",
            count: maintenance,
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${item.color} shrink-0`} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {item.label}
              <span className="ml-1 font-semibold text-slate-900 dark:text-slate-200">
                ({item.count})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

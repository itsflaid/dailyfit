"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Record<string, number | null>[];
  monthName: string;
}

const CATEGORIES = [
  { key: "STRENGTH",    label: "Kekuatan",     color: "#C41230" },
  { key: "CARDIO",      label: "Kardio",        color: "#ea580c" },
  { key: "BALANCE",     label: "Keseimbangan",  color: "#2563eb" },
  { key: "FLEXIBILITY", label: "Fleksibilitas", color: "#16a34a" },
];

export function MonthlyChart({ data, monthName }: Props) {
  const activeCategories = CATEGORIES.filter((cat) =>
    data.some((d) => (d[cat.key] ?? 0) > 0)
  );

  // Width: each day ~28px, minimum 600
  const chartWidth = Math.max(data.length * 28, 600);

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h2 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Aktivitas Bulanan</h2>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#888" }}>{monthName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeCategories.map((cat) => (
            <span key={cat.key} className="flex items-center gap-1 text-[10px]" style={{ color: "#888" }}>
              <span className="inline-block w-4 h-0.5 rounded" style={{ background: cat.color }} />
              {cat.label}
            </span>
          ))}
        </div>
      </div>

      {activeCategories.length === 0 ? (
        <div className="flex items-center justify-center h-[180px]">
          <p className="text-sm" style={{ color: "#bbb" }}>Belum ada data bulan ini</p>
        </div>
      ) : (
        /* Scrollable wrapper — shows ~60% then scrollable */
        <div
          className="overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div style={{ width: chartWidth, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: -10, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#bbb" }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    fontSize: 11,
                    padding: "6px 10px",
                  }}
                  formatter={(value, name) => {
                    const cat = CATEGORIES.find((c) => c.key === name);
                    return [value, cat?.label ?? name];
                  }}
                  labelFormatter={(label) => `Tgl ${label}`}
                  cursor={{ stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 }}
                />
                {activeCategories.map((cat) => (
                  <Line
                    key={cat.key}
                    type="monotone"
                    dataKey={cat.key}
                    stroke={cat.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: cat.color, stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scroll hint */}
      {activeCategories.length > 0 && (
        <p className="text-[10px] text-right mt-2" style={{ color: "#ccc" }}>
          ← geser untuk lihat semua →
        </p>
      )}
    </div>
  );
}
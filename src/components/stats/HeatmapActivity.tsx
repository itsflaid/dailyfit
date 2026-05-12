"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

const LEVEL_COLORS = [
  "rgba(196,18,48,0.08)",
  "#fca5a5",
  "#f87171",
  "#ef4444",
  "#dc2626",
  "#9b0e25",
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  if (count <= 9) return 4;
  return 5;
}

function getColor(count: number): string {
  return LEVEL_COLORS[getLevel(count)];
}

function formatKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildGrid(): Date[][] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + (6 - dayOfWeek));

  const weeks: Date[][] = [];
  for (let w = 51; w >= 0; w--) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(endSunday);
      date.setDate(endSunday.getDate() - w * 7 - (6 - d));
      week.push(date);
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAY_LABELS = ["Min","","Sel","","Kam","","Sab"];

const CELL = 13;
const GAP = 3;

export function ActivityHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    date: string; count: number; x: number; y: number;
  } | null>(null);

  const { data: heatmapData, isLoading } = useQuery<Record<string, number>>({
    queryKey: ["heatmap"],
    queryFn: () => fetch("/api/stats/heatmap").then((r) => r.json()),
  });

  const weeks = buildGrid();

  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const month = week[0].getMonth();
    if (month !== lastMonth) {
      monthPositions.push({ label: MONTH_LABELS[month], col: wi });
      lastMonth = month;
    }
  });

  const totalChecked = heatmapData
    ? Object.values(heatmapData).reduce((a, b) => a + b, 0)
    : 0;
  const activeDays = heatmapData
    ? Object.values(heatmapData).filter((v) => v > 0).length
    : 0;

  const DAY_LABEL_W = 28;
  const gridW = weeks.length * (CELL + GAP) - GAP;
  const totalW = DAY_LABEL_W + gridW;

  if (isLoading) {
    return (
      <div
        className="bg-white rounded-2xl p-5 animate-pulse"
        style={{ border: "1.5px solid rgba(0,0,0,0.07)", height: 160 }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Aktivitas Tahunan</h2>
          <p className="text-xs mt-0.5" style={{ color: "#888" }}>
            {activeDays} hari aktif · {totalChecked} total gerakan
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px]" style={{ color: "#aaa" }}>Sedikit</span>
          {LEVEL_COLORS.map((color, i) => (
            <div
              key={i}
              style={{
                width: 11,
                height: 11,
                background: color,
                borderRadius: 2,
                border: i === 0 ? "1px solid rgba(0,0,0,0.1)" : "none",
              }}
            />
          ))}
          <span className="text-[10px]" style={{ color: "#aaa" }}>Banyak</span>
        </div>
      </div>

      {/* Scrollable graph */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        <div style={{ width: totalW, paddingBottom: 4 }}>
          {/* Month labels */}
          <div style={{ display: "flex", paddingLeft: DAY_LABEL_W, marginBottom: 4 }}>
            {weeks.map((_, wi) => {
              const pos = monthPositions.find((m) => m.col === wi);
              return (
                <div key={wi} style={{ width: CELL + GAP, flexShrink: 0 }}>
                  {pos && (
                    <span style={{ fontSize: 9, color: "#aaa", fontWeight: 500 }}>
                      {pos.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day labels + grid */}
          <div style={{ display: "flex" }}>
            {/* Day labels */}
            <div style={{ width: DAY_LABEL_W, flexShrink: 0 }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  style={{
                    height: CELL,
                    marginBottom: i < 6 ? GAP : 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 9, color: "#bbb" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            <div style={{ display: "flex", gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                  {week.map((date, di) => {
                    const key = formatKey(date);
                    const count = heatmapData?.[key] ?? 0;
                    const color = getColor(count);
                    const isToday = key === formatKey(new Date());

                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          background: color,
                          border: isToday
                            ? "1.5px solid #C41230"
                            : count === 0
                            ? "1px solid rgba(0,0,0,0.08)"
                            : "none",
                          cursor: "pointer",
                          transition: "transform 0.1s",
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)";
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            date: date.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                            count,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                          setTooltip(null);
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y - 38,
            transform: "translateX(-50%)",
            background: "#0F0A0B",
            color: "#fff",
            fontSize: 11,
            fontWeight: 500,
            padding: "5px 10px",
            borderRadius: 8,
            pointerEvents: "none",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        >
          {tooltip.count > 0 ? `${tooltip.count} gerakan` : "Tidak ada"} · {tooltip.date}
        </div>
      )}
    </div>
  );
}
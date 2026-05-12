"use client";

import { Flame, TrendingUp, BarChart3, Calendar, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  streak: number;
  completedWeek: number;
  totalWeek: number;
  completedMonth: number;
  totalMonth: number;
  activeDaysMonth: number;
}

export function StatCards({ streak, completedWeek, totalWeek, completedMonth, totalMonth, activeDaysMonth }: Props) {
  const weekPct = totalWeek > 0 ? Math.round((completedWeek / totalWeek) * 100) : 0;
  const monthPct = totalMonth > 0 ? Math.round((completedMonth / totalMonth) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Flame, label: "Streak", value: streak, suffix: "hari" },
          { icon: TrendingUp, label: "Selesai Minggu", value: completedWeek, suffix: `/ ${totalWeek}` },
          { icon: BarChart3, label: "Aktif Bulan", value: activeDaysMonth, suffix: "hari" },
        ].map(({ icon: Icon, label, value, suffix }) => (
          <div key={label} className="bg-white rounded-2xl p-3 md:p-4" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-1 text-[10px] mb-2" style={{ color: "#888" }}>
              <Icon className="h-3 w-3 flex-shrink-0" style={{ color: "#C41230" }} />
              <span className="truncate leading-tight">{label}</span>
            </div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="font-display text-2xl md:text-3xl" style={{ color: "#0F0A0B" }}>{value}</span>
              {suffix && <span className="text-[10px]" style={{ color: "#aaa" }}>{suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {[
          { icon: Zap, label: "Minggu Ini", completed: completedWeek, total: totalWeek, pct: weekPct },
          { icon: Calendar, label: "Bulan Ini", completed: completedMonth, total: totalMonth, pct: monthPct },
        ].map(({ icon: Icon, label, completed, total, pct }) => (
          <div key={label} className="bg-white rounded-2xl p-4" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(196,18,48,0.08)" }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: "#C41230" }} />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "#0F0A0B" }}>{label}</div>
                  <div className="text-[10px]" style={{ color: "#888" }}>{completed} dari {total} gerakan</div>
                </div>
              </div>
              <span className="font-display text-2xl" style={{ color: "#C41230" }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#C41230,#9b0e25)" }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
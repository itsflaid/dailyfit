"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORY_LABEL, type ExerciseCategory } from "@/types";

const PIE_COLORS = ["#C41230", "#f97316", "#22c55e", "#3b82f6"];

interface Props {
  data: { name: string; value: number }[];
}

export function CategoryChart({ data }: Props) {
  const labeled = data.map((d) => ({
    ...d,
    label: CATEGORY_LABEL[d.name as ExerciseCategory] ?? d.name,
  }));

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
      <h2 className="font-display text-xl mb-4" style={{ color: "#0F0A0B" }}>Distribusi Kategori</h2>
      {!labeled.length ? (
        <p className="text-sm" style={{ color: "#888" }}>Belum ada data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={labeled} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={65} innerRadius={35} paddingAngle={2}>
              {labeled.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#64748b" }}>{v}</span>} />
            <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12, padding: "8px 12px" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
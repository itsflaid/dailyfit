"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Props {
  data: { day: string; total: number; completed: number }[];
}

export function WeeklyChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
      <h2 className="font-display text-xl mb-4" style={{ color: "#0F0A0B" }}>7 Hari Terakhir</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={22} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12, padding: "8px 12px" }}
            cursor={{ fill: "#fef2f2" }}
          />
          <Bar dataKey="completed" name="Selesai" fill="#C41230" radius={[6, 6, 0, 0]} />
          <Bar dataKey="total" name="Total" fill="#fecaca" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
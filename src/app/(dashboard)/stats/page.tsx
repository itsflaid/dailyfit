"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { StatCards } from "@/components/stats/StatCard";
import { WeeklyChart } from "@/components/stats/WeeklyChart";
import { MonthlyChart } from "@/components/stats/MonthlyChart";
import { CategoryChart } from "@/components/stats/CategoryChart";
import { TopExercises } from "@/components/stats/TopExercises";
import { ActivityHeatmap } from "@/components/stats/HeatmapActivity";

interface StatsData {
  streak: number;
  totalWeek: number;
  completedWeek: number;
  totalMonth: number;
  completedMonth: number;
  activeDaysMonth: number;
  monthName: string;
  weeklyData: { day: string; total: number; completed: number }[];
  monthlyData: { date: number; total: number | null; completed: number | null }[];
  topExercises: { name: string; count: number }[];
  allExercises: { name: string; count: number }[];
  categoryData: { name: string; value: number }[];
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 28 },
  },
};

function getInitialMonth(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

export default function StatsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["stats", selectedMonth],
    queryFn: () =>
      fetch(`/api/stats?month=${selectedMonth}`, { cache: "no-store" }).then(
        (r) => r.json()
      ),
    refetchOnMount: "always",
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl h-24 animate-pulse"
            style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-5 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={cardVariants}>
        <p
          className="text-[0.72rem] font-semibold tracking-[2.5px] uppercase mb-1"
          style={{ color: "#C41230" }}
        >
          Progress
        </p>
        <h1
          className="font-display text-4xl md:text-5xl"
          style={{ color: "#0F0A0B" }}
        >
          Statistik
        </h1>
      </motion.div>

      <motion.div variants={cardVariants}>
        <StatCards
          streak={stats?.streak ?? 0}
          completedWeek={stats?.completedWeek ?? 0}
          totalWeek={stats?.totalWeek ?? 0}
          completedMonth={stats?.completedMonth ?? 0}
          totalMonth={stats?.totalMonth ?? 0}
          activeDaysMonth={stats?.activeDaysMonth ?? 0}
        />
      </motion.div>

      <motion.div
        className="grid md:grid-cols-2 gap-4 min-w-0"
        variants={cardVariants}
      >
        <div className="min-w-0">
          <WeeklyChart data={stats?.weeklyData ?? []} />
        </div>

        <div className="min-w-0">
          <MonthlyChart
            data={stats?.monthlyData ?? []}
            monthName={stats?.monthName ?? ""}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </motion.div>

      <motion.div className="grid md:grid-cols-2 gap-4" variants={cardVariants}>
        <TopExercises
          top={stats?.topExercises ?? []}
          all={stats?.allExercises ?? []}
        />
        <CategoryChart data={stats?.categoryData ?? []} />
      </motion.div>

      <motion.div variants={cardVariants}>
        <ActivityHeatmap />
      </motion.div>
    </motion.div>
  );
}

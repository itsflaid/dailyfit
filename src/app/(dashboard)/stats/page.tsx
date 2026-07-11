"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";
import { FileDown, Calendar, CalendarDays, X } from "lucide-react";
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState<"mingguan" | "bulanan" | null>(null);

  const REPORT_ENDPOINT: Record<"mingguan" | "bulanan", string> = {
    mingguan: "weekly",
    bulanan: "monthly",
  };

  const handleExportPdf = async (type: "mingguan" | "bulanan") => {
    setExporting(type);
    setShowExportModal(false);
    try {
      const res = await fetch(`/api/reports/${REPORT_ENDPOINT[type]}`);
      if (!res.ok) throw new Error("Gagal membuat laporan");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dailyfit-laporan-${type}-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Gagal mengekspor laporan, coba lagi.");
    } finally {
      setExporting(null);
    }
  };
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["stats", selectedMonth],
    queryFn: () =>
      fetch(`/api/stats?month=${selectedMonth}`, { cache: "no-store" }).then(
        (r) => r.json()
      ),
    placeholderData: keepPreviousData,
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
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-4">
        <div>
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
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={exporting !== null}
          className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-60 shrink-0"
        >
          <FileDown className="h-4 w-4" />
          {exporting ? "Menyiapkan PDF..." : "Laporan"}
        </button>
      </motion.div>

      {/* Export modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExportModal(false)}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
                <h3 className="font-display text-2xl" style={{ color: "#0F0A0B" }}>Export Laporan</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition"
                  style={{ background: "rgba(0,0,0,0.05)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                >
                  <X className="h-4 w-4" style={{ color: "#555" }} />
                </button>
              </div>

              <div className="p-5 space-y-3">
                <button
                  onClick={() => handleExportPdf("mingguan")}
                  disabled={exporting !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition disabled:opacity-50"
                  style={{ background: "rgba(196,18,48,0.06)", border: "1.5px solid rgba(196,18,48,0.15)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,18,48,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,18,48,0.06)")}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#C41230" }}>
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold" style={{ color: "#0F0A0B" }}>Laporan Mingguan</div>
                    <div className="text-xs mt-0.5" style={{ color: "#888" }}>7 hari terakhir</div>
                  </div>
                </button>

                <button
                  onClick={() => handleExportPdf("bulanan")}
                  disabled={exporting !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition disabled:opacity-50"
                  style={{ background: "rgba(0,0,0,0.03)", border: "1.5px solid rgba(0,0,0,0.07)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                >
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "#0F0A0B" }}>
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold" style={{ color: "#0F0A0B" }}>Laporan Bulanan</div>
                    <div className="text-xs mt-0.5" style={{ color: "#888" }}>30 hari terakhir</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

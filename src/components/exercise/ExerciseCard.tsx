"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, Dumbbell, Timer, Flame } from "lucide-react";
import { MUSCLE_GROUP_LABEL, exerciseDetail, type Exercise, type ExerciseCategory } from "@/types";

const CATEGORY_GRADIENT: Record<ExerciseCategory, { from: string; to: string }> = {
  STRENGTH:    { from: "#C41230", to: "#7f1d1d" },
  CARDIO:      { from: "#ea580c", to: "#9a3412" },
  BALANCE:     { from: "#2563eb", to: "#1e40af" },
  FLEXIBILITY: { from: "#16a34a", to: "#15803d" },
};

interface Props {
  exercise: Exercise;
  index: number;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
}

function CategoryShapes({ category }: { category: ExerciseCategory }) {
  if (category === "CARDIO") {
    return (
      <>
        <div className="absolute pointer-events-none" style={{ width: 100, height: 100, borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%", border: "20px solid rgba(255,255,255,0.07)", right: -30, top: -25 }} />
        <div className="absolute pointer-events-none" style={{ width: 50, height: 50, borderRadius: "50% 50% 50% 50% / 60% 40% 60% 40%", border: "12px solid rgba(255,255,255,0.05)", left: -10, bottom: -18 }} />
      </>
    );
  }

  if (category === "BALANCE") {
    return (
      <>
        <div className="absolute pointer-events-none" style={{ width: 90, height: 90, borderRadius: "40% 60% 60% 40% / 50% 50% 50% 50%", border: "18px solid rgba(255,255,255,0.07)", right: -25, top: -20, transform: "rotate(25deg)" }} />
        <div className="absolute pointer-events-none" style={{ width: 45, height: 45, borderRadius: "50%", border: "10px solid rgba(255,255,255,0.06)", left: 15, bottom: -15 }} />
      </>
    );
  }

  if (category === "FLEXIBILITY") {
    return (
      <>
        <div className="absolute pointer-events-none" style={{ width: 110, height: 110, borderRadius: "20% 80% 40% 60% / 60% 20% 80% 40%", border: "22px solid rgba(255,255,255,0.06)", right: -35, top: -30 }} />
        <div className="absolute pointer-events-none" style={{ width: 40, height: 40, borderRadius: "60% 40% 50% 50% / 40% 60% 40% 60%", border: "10px solid rgba(255,255,255,0.05)", left: -8, bottom: -12 }} />
      </>
    );
  }

  return (
    <>
      <div className="absolute pointer-events-none rounded-full" style={{ width: 120, height: 120, border: "24px solid rgba(255,255,255,0.07)", right: -35, top: -35 }} />
      <div className="absolute pointer-events-none rounded-full" style={{ width: 60, height: 60, border: "14px solid rgba(255,255,255,0.05)", left: -15, bottom: -25 }} />
    </>
  );
}

export function ExerciseCard({ exercise: ex, index, onEdit, onDelete }: Props) {
  const gradient = CATEGORY_GRADIENT[ex.category];
  const isTime = ex.type === "TIME_BASED";

  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -4 }}
      className="group rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* ── Gradient header ── */}
      <div
        className="relative px-5 pt-5 pb-5 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)` }}
      >
        <CategoryShapes category={ex.category} />

        {/* action buttons */}
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={() => onEdit(ex)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition"
            style={{ background: "rgba(255,255,255,0.15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            onClick={() => onDelete(ex.id)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        {/* icon, name, muscle group - vertical */}
        <div className="flex flex-col items-start gap-2 pr-14 mt-1">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {isTime
              ? <Timer className="h-4 w-4 text-white" />
              : <Dumbbell className="h-4 w-4 text-white" />
            }
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-display text-2xl leading-tight text-white line-clamp-2">
              {ex.name}
            </h3>
            <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              {MUSCLE_GROUP_LABEL[ex.muscleGroup]}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom stats (compact) ── */}
      <div className="bg-white px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5" style={{ color: gradient.from }} />
          <span className="text-xs font-semibold" style={{ color: "#333" }}>
            {exerciseDetail(ex)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

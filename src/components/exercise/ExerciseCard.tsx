"use client";

import { Pencil, Trash2, Dumbbell, Timer, Flame } from "lucide-react";
import { CATEGORY_LABEL, MUSCLE_GROUP_LABEL, exerciseDetail, type Exercise, type ExerciseCategory } from "@/types";

const CATEGORY_ACCENT: Record<ExerciseCategory, { bg: string; dot: string; text: string }> = {
  STRENGTH:    { bg: "#C41230", dot: "#C41230", text: "#C41230" },
  CARDIO:      { bg: "#ea580c", dot: "#ea580c", text: "#ea580c" },
  BALANCE:     { bg: "#2563eb", dot: "#2563eb", text: "#2563eb" },
  FLEXIBILITY: { bg: "#16a34a", dot: "#16a34a", text: "#16a34a" },
};

interface Props {
  exercise: Exercise;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
}

export function ExerciseCard({ exercise: ex, onEdit, onDelete }: Props) {
  const accent = CATEGORY_ACCENT[ex.category];
  const isTime = ex.type === "TIME_BASED";

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex">
      {/* Left accent bar */}
      <div className="w-1.5 flex-shrink-0" style={{ background: accent.bg }} />

      <div className="flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3.5">
            {/* Icon */}
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{
                background: `linear-gradient(145deg, ${accent.bg}15, ${accent.bg}08)`,
                border: `1px solid ${accent.bg}25`,
              }}
            >
              {isTime
                ? <Timer className="h-5 w-5" style={{ color: accent.dot }} />
                : <Dumbbell className="h-5 w-5" style={{ color: accent.dot }} />
              }
            </div>

            {/* Name & Category */}
            <div className="min-w-0 pt-0.5">
              <h3 className="font-semibold text-lg leading-tight text-gray-900 tracking-[-0.02em] line-clamp-2 mb-1">
                {ex.name}
              </h3>
              <div
                className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase"
                style={{ color: accent.text }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent.dot }} />
                {CATEGORY_LABEL[ex.category]}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onEdit(ex)}
              className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(ex.id)}
              className="h-8 w-8 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Stats & Muscle Group */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-xl">
            <Flame className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-semibold text-sm tabular-nums tracking-tight">
              {exerciseDetail(ex)}
            </span>
          </div>

          <div
            className="text-xs font-medium px-3 py-1.5 rounded-xl border"
            style={{ borderColor: "rgba(0,0,0,0.08)", color: "#555" }}
          >
            {MUSCLE_GROUP_LABEL[ex.muscleGroup]}
          </div>
        </div>
      </div>
    </div>
  );
}
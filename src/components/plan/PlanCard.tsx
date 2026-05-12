"use client";

import { useState } from "react";
import { Trash2, ChevronDown, Pencil, Dumbbell, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exerciseDetail, CATEGORY_LABEL, type Plan, type ExerciseCategory } from "@/types";

const CATEGORY_DOT: Record<ExerciseCategory, string> = {
  STRENGTH: "#C41230",
  CARDIO: "#ea580c",
  BALANCE: "#2563eb",
  FLEXIBILITY: "#16a34a",
};

interface Props {
  plan: Plan;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (plan: Plan) => void;
}

export function PlanCard({ plan, index, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const count = plan.items?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      {/* ── Top: Crimson header ── */}
      <div
        className="relative px-5 pt-5 pb-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #C41230 0%, #9B0E25 100%)" }}
      >
        {/* decorative circle */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{ width: 140, height: 140, border: "28px solid rgba(255,255,255,0.07)", right: -40, top: -40 }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{ width: 70, height: 70, border: "16px solid rgba(255,255,255,0.05)", left: -20, bottom: -30 }}
        />

        {/* action buttons */}
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={() => onEdit(plan)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition"
            style={{ background: "rgba(255,255,255,0.15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="h-7 w-7 rounded-lg flex items-center justify-center transition"
            style={{ background: "rgba(255,255,255,0.12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        </div>

        {/* count badge */}
        <span
          className="text-[10px] font-semibold tracking-[1.5px] uppercase px-2.5 py-1 rounded-full inline-block mb-2"
          style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}
        >
          {count} latihan
        </span>

        {/* title */}
        <h3 className="font-display text-2xl leading-tight text-white pr-16">
          {plan.title}
        </h3>
        {plan.description && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {plan.description}
          </p>
        )}

        {/* preview exercise pills */}
        {plan.items && plan.items.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {plan.items.slice(0, 3).map((item) => item.exercise && (
              <span
                key={item.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}
              >
                {item.exercise.name}
              </span>
            ))}
            {plan.items.length > 3 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
              >
                +{plan.items.length - 3} lagi
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom: white expand button ── */}
      <div className="bg-white">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 transition"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F4F1")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span className="text-xs font-semibold" style={{ color: "#888" }}>
            {expanded ? "Sembunyikan latihan" : "Lihat semua latihan"}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4" style={{ color: "#aaa" }} />
          </motion.div>
        </button>

        {/* Expandable exercise list */}
        <AnimatePresence>
          {expanded && plan.items && plan.items.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden", borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="px-5 py-3 space-y-2.5 bg-white">
                {plan.items.map((item, i) => item.exercise && (
                  <div key={item.id} className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                      style={{ background: "#C41230" }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "#0F0A0B" }}>{item.exercise.name}</div>
                      <div className="text-xs" style={{ color: "#888" }}>{exerciseDetail(item.exercise)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className="h-5 w-5 rounded-md flex items-center justify-center"
                        style={{ background: `${CATEGORY_DOT[item.exercise.category]}15` }}
                      >
                        {item.exercise.type === "TIME_BASED"
                          ? <Timer className="h-3 w-3" style={{ color: CATEGORY_DOT[item.exercise.category] }} />
                          : <Dumbbell className="h-3 w-3" style={{ color: CATEGORY_DOT[item.exercise.category] }} />
                        }
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide hidden sm:block"
                        style={{ color: CATEGORY_DOT[item.exercise.category] }}
                      >
                        {CATEGORY_LABEL[item.exercise.category]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
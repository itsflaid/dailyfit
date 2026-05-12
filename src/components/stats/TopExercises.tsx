"use client";

import { useState } from "react";
import { Trophy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Exercise {
  name: string;
  count: number;
}

interface Props {
  top: Exercise[];
  all: Exercise[];
}

export function TopExercises({ top, all }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }}>
        <div className="p-4 md:p-5 pb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 flex-shrink-0" style={{ color: "#C41230" }} />
          <h2 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Aktivitas Teratas</h2>
        </div>

        {!top.length ? (
          <div className="px-5 pb-5">
            <p className="text-sm" style={{ color: "#888" }}>Belum ada data.</p>
          </div>
        ) : (
          <>
            <div className="px-4 md:px-5 space-y-2.5 pb-3">
              {top.map((ex, i) => (
                <div key={ex.name} className="flex items-center gap-3 py-0.5">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{
                      background: i === 0 ? "#C41230" : i === 1 ? "rgba(196,18,48,0.12)" : "rgba(0,0,0,0.05)",
                      color: i === 0 ? "#fff" : i === 1 ? "#C41230" : "#888",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#0F0A0B" }}>{ex.name}</div>
                    <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg,#C41230,#9b0e25)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((ex.count / (top[0]?.count || 1)) * 100, 100)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: "#C41230" }}>{ex.count}x</span>
                </div>
              ))}
            </div>

            {all.length > 5 && (
              <div className="px-5 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full text-sm font-semibold transition"
                  style={{ color: "#C41230" }}
                >
                  Lihat semua {all.length} gerakan →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* All exercises modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1.5px solid rgba(0,0,0,0.07)" }}>
                <div>
                  <h3 className="font-display text-2xl" style={{ color: "#0F0A0B" }}>Semua Gerakan</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>{all.length} gerakan pernah dilakukan</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition"
                  style={{ background: "rgba(0,0,0,0.05)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                >
                  <X className="h-4 w-4" style={{ color: "#555" }} />
                </button>
              </div>

              {/* Modal list */}
              <div className="overflow-y-auto px-5 py-3 space-y-2.5">
                {all.map((ex, i) => (
                  <div key={ex.name} className="flex items-center gap-3 py-0.5">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: i < 3 ? "rgba(196,18,48,0.1)" : "rgba(0,0,0,0.05)",
                        color: i < 3 ? "#C41230" : "#888",
                        minWidth: 28,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "#0F0A0B" }}>{ex.name}</div>
                      <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((ex.count / (all[0]?.count || 1)) * 100, 100)}%`,
                            background: i < 3 ? "linear-gradient(90deg,#C41230,#9b0e25)" : "#ddd",
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: i < 3 ? "#C41230" : "#888" }}>
                      {ex.count}x
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
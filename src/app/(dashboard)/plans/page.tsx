"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ListChecks } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { PlanCard } from "@/components/plan/PlanCard";
import { PlanModal } from "@/components/plan/PlanModal";
import { type Plan } from "@/types";

export default function PlansPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => fetch("/api/plans").then((r) => r.json()),
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/plans/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (!res.ok) return toast.error("Gagal menghapus");
    toast.success("Rencana dihapus");
    qc.invalidateQueries({ queryKey: ["plans"] });
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (plan: Plan) => { setEditing(plan); setModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold tracking-[2.5px] uppercase mb-1" style={{ color: "#C41230" }}>
            Workout Plans
          </p>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: "#0F0A0B" }}>
            Rencana Latihan
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm flex-shrink-0"
          style={{ background: "#C41230" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#9B0E25")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Buat Rencana</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-[100px] animate-pulse" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }} />
          ))}
        </div>
      ) : !plans?.length ? (
        <div className="rounded-2xl p-14 text-center space-y-4" style={{ border: "2px dashed rgba(0,0,0,0.1)" }}>
          <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(196,18,48,0.07)" }}>
            <ListChecks className="h-8 w-8" style={{ color: "#C41230", opacity: 0.5 }} />
          </div>
          <div>
            <h3 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Belum ada rencana</h3>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Susun rencana pertama Anda dari pustaka latihan.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ background: "#C41230" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#9B0E25")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
          >
            <Plus className="h-4 w-4" /> Buat Rencana
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <AnimatePresence>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                onDelete={setDeleteId}
                onEdit={openEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal create/edit */}
      <PlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["plans"] })}
        initial={editing}
      />

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display text-2xl" style={{ color: "#0F0A0B" }}>Hapus rencana?</h3>
            <p className="text-sm" style={{ color: "#888" }}>Tindakan ini permanen dan tidak bisa dibatalkan.</p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F4F1")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: "#C41230" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#9B0E25")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
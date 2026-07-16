"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Dumbbell, SlidersHorizontal, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import AOS from "aos";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ExerciseModal } from "@/components/exercise/ExerciseModal";
import { ExerciseCard } from "@/components/exercise/ExerciseCard";
import { CATEGORY_LABEL, MUSCLE_GROUP_LABEL, type Exercise, type ExerciseCategory, type MuscleGroup } from "@/types";

const ALL = "ALL";

export default function ExercisesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExerciseCategory | typeof ALL>(ALL);
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | typeof ALL>(ALL);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () => fetch("/api/exercises").then((r) => r.json()),
  });

  useEffect(() => {
    AOS.refreshHard();
  }, [filtered.length]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((ex) => {
      const catOk = filterCategory === ALL || ex.category === filterCategory;
      const musOk = filterMuscle === ALL || ex.muscleGroup === filterMuscle;
      return catOk && musOk;
    });
  }, [data, filterCategory, filterMuscle]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/exercises/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (!res.ok) return toast.error("Gagal menghapus");
    toast.success("Latihan dihapus");
    qc.invalidateQueries({ queryKey: ["exercises"] });
  };

  const hasFilter = filterCategory !== ALL || filterMuscle !== ALL;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-semibold tracking-[2.5px] uppercase mb-1" style={{ color: "#C41230" }}>
            Koleksi Pribadi
          </p>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: "#0F0A0B" }}>
            Pustaka Latihan
          </h1>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm flex-shrink-0"
          style={{ background: "#C41230" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#9B0E25")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Filters */}
      {data?.length ? (
        <>
          {/* Desktop: inline chips */}
          <div className="hidden md:block space-y-3">
            <div className="flex gap-2 flex-wrap">
              <FilterChip
                active={filterCategory === ALL}
                onClick={() => setFilterCategory(ALL)}
                label="All"
              />
              {(Object.entries(CATEGORY_LABEL) as [ExerciseCategory, string][]).map(([k, v]) => (
                <FilterChip
                  key={k}
                  active={filterCategory === k}
                  onClick={() => setFilterCategory(filterCategory === k ? ALL : k)}
                  label={v}
                />
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <FilterChip
                active={filterMuscle === ALL}
                onClick={() => setFilterMuscle(ALL)}
                label="All Muscles"
                secondary
              />
              {(Object.entries(MUSCLE_GROUP_LABEL) as [MuscleGroup, string][]).map(([k, v]) => (
                <FilterChip
                  key={k}
                  active={filterMuscle === k}
                  onClick={() => setFilterMuscle(filterMuscle === k ? ALL : k)}
                  label={v}
                  secondary
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "#888" }}>
                {filtered.length} of {data.length} exercises
              </p>
              {hasFilter && (
                <button
                  onClick={() => { setFilterCategory(ALL); setFilterMuscle(ALL); }}
                  className="text-xs font-semibold transition"
                  style={{ color: "#C41230" }}
                >
                  Reset filter
                </button>
              )}
            </div>
          </div>

          {/* Mobile: filter button + result count */}
          <div className="md:hidden flex items-center justify-between">
            <p className="text-sm" style={{ color: "#888" }}>
              {filtered.length} of {data.length} exercises
            </p>
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition"
              style={{
                background: hasFilter ? "#C41230" : "rgba(0,0,0,0.05)",
                color: hasFilter ? "#fff" : "#888",
              }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
        </>
      ) : null}

      {/* Mobile filter modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#0F0A0B" }}>Filter</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.05)" }}
              >
                <X className="h-4 w-4" style={{ color: "#555" }} />
              </button>
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>Kategori</p>
              <div className="flex gap-2 flex-wrap">
                <FilterChip
                  active={filterCategory === ALL}
                  onClick={() => setFilterCategory(ALL)}
                  label="All"
                />
                {(Object.entries(CATEGORY_LABEL) as [ExerciseCategory, string][]).map(([k, v]) => (
                  <FilterChip
                    key={k}
                    active={filterCategory === k}
                    onClick={() => setFilterCategory(filterCategory === k ? ALL : k)}
                    label={v}
                  />
                ))}
              </div>
            </div>

            {/* Muscle group */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#888" }}>Otot</p>
              <div className="flex gap-2 flex-wrap">
                <FilterChip
                  active={filterMuscle === ALL}
                  onClick={() => setFilterMuscle(ALL)}
                  label="All Muscles"
                  secondary
                />
                {(Object.entries(MUSCLE_GROUP_LABEL) as [MuscleGroup, string][]).map(([k, v]) => (
                  <FilterChip
                    key={k}
                    active={filterMuscle === k}
                    onClick={() => setFilterMuscle(filterMuscle === k ? ALL : k)}
                    label={v}
                    secondary
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              {hasFilter && (
                <button
                  onClick={() => { setFilterCategory(ALL); setFilterMuscle(ALL); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
                  style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: "#C41230" }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-[120px] animate-pulse" style={{ border: "1.5px solid rgba(0,0,0,0.07)" }} />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="rounded-2xl p-14 text-center space-y-4" style={{ border: "2px dashed rgba(0,0,0,0.1)" }}>
          <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "rgba(196,18,48,0.07)" }}>
            <Dumbbell className="h-8 w-8" style={{ color: "#C41230", opacity: 0.5 }} />
          </div>
          <div>
            <h3 className="font-display text-xl" style={{ color: "#0F0A0B" }}>Belum ada latihan</h3>
            <p className="text-sm mt-1" style={{ color: "#888" }}>Mulai dengan menambahkan latihan pertama Anda.</p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ background: "#C41230" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#9B0E25")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
          >
            <Plus className="h-4 w-4" /> Tambah Latihan
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="rounded-2xl p-12 text-center space-y-3" style={{ border: "2px dashed rgba(0,0,0,0.08)" }}>
          <p className="font-display text-xl" style={{ color: "#0F0A0B" }}>Tidak ada hasil</p>
          <p className="text-sm" style={{ color: "#888" }}>Coba ubah filter kategori atau kelompok otot.</p>
          <button
            onClick={() => { setFilterCategory(ALL); setFilterMuscle(ALL); }}
            className="text-sm font-semibold"
            style={{ color: "#C41230" }}
          >
            Reset filter
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex, i) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                index={i}
                onEdit={(ex) => { setEditing(ex); setModalOpen(true); }}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      <ExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["exercises"] })}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-display text-2xl" style={{ color: "#0F0A0B" }}>Hapus latihan?</h3>
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
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
                style={{ background: "#C41230" }}
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "#9B0E25"; }}
                onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "#C41230"; }}
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  secondary = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={{
        background: active
          ? secondary ? "#0F0A0B" : "#C41230"
          : "rgba(0,0,0,0.05)",
        color: active ? "#fff" : "#888",
        border: active
          ? `1.5px solid ${secondary ? "#0F0A0B" : "#C41230"}`
          : "1.5px solid transparent",
      }}
    >
      {label}
    </button>
  );
}
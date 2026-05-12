"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { exerciseDetail, type Plan, type Exercise } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Plan | null;
}

export function PlanModal({ open, onClose, onSaved, initial }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setSelectedIds(initial?.items?.map((i) => i.exerciseId) ?? []);
    }
  }, [open, initial]);

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () => fetch("/api/exercises").then((r) => r.json()),
    enabled: open,
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Judul wajib diisi");
    setSaving(true);

    const res = await fetch(initial ? `/api/plans/${initial.id}` : "/api/plans", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, exerciseIds: selectedIds }),
    });

    setSaving(false);
    if (!res.ok) return toast.error("Gagal menyimpan");
    toast.success(initial ? "Rencana diperbarui!" : "Rencana dibuat!");
    onClose();
    onSaved();
  };

  if (!open) return null;

  const inputStyle = {
    border: "1.5px solid rgba(0,0,0,0.1)",
    color: "#0F0A0B",
    background: "#fff",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl" style={{ color: "#0F0A0B" }}>
            {initial ? "Edit Rencana" : "Buat Rencana Baru"}
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center transition"
            style={{ background: "rgba(0,0,0,0.05)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
          >
            <X className="h-4 w-4" style={{ color: "#555" }} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#555" }}>Judul</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Latihan Pagi"
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#C41230")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: "#555" }}>Deskripsi (opsional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat..."
            rows={2}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition resize-none"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#C41230")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: "#555" }}>
            Pilih Latihan{" "}
            <span style={{ color: "#C41230" }}>({selectedIds.length} dipilih)</span>
          </label>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {!exercises?.length ? (
              <div className="flex items-center gap-2 text-sm py-4 justify-center" style={{ color: "#888" }}>
                <Dumbbell className="h-4 w-4" />
                Belum ada latihan di pustaka
              </div>
            ) : exercises.map((ex) => {
              const checked = selectedIds.includes(ex.id);
              return (
                <label
                  key={ex.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition"
                  style={{
                    border: `1.5px solid ${checked ? "#C41230" : "rgba(0,0,0,0.08)"}`,
                    background: checked ? "rgba(196,18,48,0.04)" : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(ex.id)}
                    className="accent-red-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#0F0A0B" }}>{ex.name}</div>
                    <div className="text-xs" style={{ color: "#888" }}>{exerciseDetail(ex)}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition"
            style={{ border: "1.5px solid rgba(0,0,0,0.1)", color: "#555" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F6F4F1")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
            style={{ background: "#C41230" }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#9B0E25"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#C41230")}
          >
            {saving ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Buat Rencana"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
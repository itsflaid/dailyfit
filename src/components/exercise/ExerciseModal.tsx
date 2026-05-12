"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  CATEGORY_LABEL, MUSCLE_GROUP_LABEL,
  type Exercise, type ExerciseCategory, type ExerciseType, type MuscleGroup,
} from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Exercise | null;
  onSaved: () => void;
}

export function ExerciseModal({ open, onClose, initial, onSaved }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("STRENGTH");
  const [type, setType] = useState<ExerciseType>("REPS_BASED");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("CHEST");
  const [reps, setReps] = useState(12);
  const [sets, setSets] = useState(3);
  const [duration, setDuration] = useState(60);
  const [timeSets, setTimeSets] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? "STRENGTH");
      setType(initial?.type ?? "REPS_BASED");
      setMuscleGroup(initial?.muscleGroup ?? "CHEST");
      setReps(initial?.reps ?? 12);
      setSets(initial?.sets ?? 3);
      setDuration(initial?.durationSeconds ?? 60);
      setTimeSets(initial?.timeSets ?? 3);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Nama latihan wajib diisi");
    setSaving(true);

    const payload = {
      name: name.trim(),
      category,
      type,
      muscleGroup,
      reps: type === "REPS_BASED" ? reps : null,
      sets: type === "REPS_BASED" ? sets : null,
      durationSeconds: type === "TIME_BASED" ? duration : null,
      timeSets: type === "TIME_BASED" ? timeSets : null,
    };

    try {
      const res = await fetch(
        initial ? `/api/exercises/${initial.id}` : "/api/exercises",
        {
          method: initial ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error();
      toast.success(initial ? "Latihan diperbarui" : "Latihan ditambahkan");
      onClose();
      onSaved();
    } catch {
      toast.error("Gagal menyimpan latihan");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {initial ? "Edit Latihan" : "Tambah Latihan"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push up"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
          >
            {(Object.entries(CATEGORY_LABEL) as [ExerciseCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Muscle Group */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Kelompok Otot</label>
          <select
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
          >
            {(Object.entries(MUSCLE_GROUP_LABEL) as [MuscleGroup, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Type toggle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tipe</label>
          <div className="grid grid-cols-2 gap-2">
            {(["REPS_BASED", "TIME_BASED"] as ExerciseType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 rounded-lg text-sm font-medium border transition ${
                  type === t
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-slate-200 text-slate-600 hover:bg-off"
                }`}
              >
                {t === "REPS_BASED" ? "Berbasis Reps" : "Berbasis Waktu"}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional fields */}
        {type === "REPS_BASED" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Reps</label>
              <input
                type="number" min={1} value={reps}
                onChange={(e) => setReps(+e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Set</label>
              <input
                type="number" min={1} value={sets}
                onChange={(e) => setSets(+e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Durasi (detik)</label>
              <input
                type="number" min={1} value={duration}
                onChange={(e) => setDuration(+e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Set</label>
              <input
                type="number" min={1} value={timeSets}
                onChange={(e) => setTimeSets(+e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-off transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

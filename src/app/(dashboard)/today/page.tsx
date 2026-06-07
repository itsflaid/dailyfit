"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ListChecks, CalendarCheck2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateLabel, getTodayDate } from "@/lib/utils";
import { exerciseDetail, CATEGORY_LABEL, type DailyLog, type Exercise, type Plan } from "@/types";

export default function TodayPage() {
  const qc = useQueryClient();
  const [planOpen, setPlanOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const date = getTodayDate();

  const { data: log, isLoading } = useQuery<DailyLog>({
    queryKey: ["daily", date],
    queryFn: () => fetch(`/api/daily-logs?date=${date}`).then((r) => r.json()),
  });

  const items = log?.items ?? [];
  const completed = items.filter((i) => i.isChecked).length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const refreshProgressCaches = () => {
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["heatmap"] });
  };

  const toggleMutation = useMutation({
    mutationKey: ["daily-progress"],
    scope: { id: "daily-progress" },
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const res = await fetch(`/api/daily-logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked: !current }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui");
    },
    onMutate: ({ id, current }) => {
      qc.setQueryData<DailyLog>(["daily", date], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) =>
            i.id === id ? { ...i, isChecked: !current } : i
          ),
        };
      });
    },
    onError: (_error, { id, current }) => {
      qc.setQueryData<DailyLog>(["daily", date], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) =>
            i.id === id ? { ...i, isChecked: current } : i
          ),
        };
      });
      toast.error("Gagal memperbarui");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["daily", date] });
      refreshProgressCaches();
    },
  });

  const addMutation = useMutation({
    mutationKey: ["daily-progress"],
    scope: { id: "daily-progress" },
    mutationFn: async ({
      exerciseIds,
      source,
    }: {
      exerciseIds: string[];
      source: "plan" | "manual";
    }) => {
      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, exerciseIds, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Gagal menambahkan");
      return data as DailyLog & { added?: number };
    },
    onSuccess: (data) => {
      if (data.added === 0) {
        toast.info("Latihan sudah ada di hari ini");
        return;
      }

      qc.setQueryData<DailyLog>(["daily", date], data);
      toast.success("Latihan ditambahkan");
    },
    onError: () => {
      toast.error("Gagal menambahkan");
    },
    onSettled: () => {
      refreshProgressCaches();
    },
  });

  const toggle = (id: string, current: boolean) => {
    toggleMutation.mutate({ id, current });
  };

  const addExercises = (exerciseIds: string[], source: "plan" | "manual") => {
    addMutation.mutate({ exerciseIds, source });
  };

  return (
    <div className="space-y-6">
      {/* Header with crimson gradient */}
      <div className="crimson-gradient rounded-2xl p-6 text-white shadow-lg">
        <div className="text-xs uppercase tracking-widest text-red-200 font-semibold mb-1">
          Checklist Harian
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
          {formatDateLabel(new Date())}
        </h1>
        {total > 0 && (
          <p className="text-red-100 text-sm mb-4">
            {completed} dari {total} latihan selesai
          </p>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-2 rounded-full bg-white/20 overflow-hidden mb-4">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setPlanOpen(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition backdrop-blur"
          >
            <ListChecks className="h-4 w-4" />
            Dari Rencana
          </button>
          <button
            onClick={() => setManualOpen(true)}
            className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Manual
          </button>
        </div>
      </div>

      {/* Checklist items */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Memuat...</div>
      ) : !items.length ? (
        <div className="border-2 border-dashed rounded-2xl p-12 text-center space-y-3">
          <CalendarCheck2 className="h-12 w-12 mx-auto text-slate-300" />
          <h3 className="font-semibold text-slate-700">Belum ada latihan hari ini</h3>
          <p className="text-sm text-muted-foreground">Muat dari rencana atau tambah secara manual.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition shadow-sm ${
                item.isChecked ? "opacity-70" : ""
              }`}
            >
              <button
                onClick={() => toggle(item.id, item.isChecked)}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  item.isChecked
                    ? "bg-primary-600 border-primary-600"
                    : "border-slate-300 hover:border-primary-400"
                }`}
              >
                {item.isChecked && <Check className="h-3.5 w-3.5 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className={`font-medium text-ink ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
                  {item.exercise.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {exerciseDetail(item.exercise)}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground capitalize hidden sm:block">
                  {item.source === "plan" ? "rencana" : "manual"}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border bg-off text-slate-600 border-slate-200 hidden sm:block">
                  {CATEGORY_LABEL[item.exercise.category]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {planOpen && (
        <PickPlanModal
          onClose={() => setPlanOpen(false)}
          onPick={(ids) => { addExercises(ids, "plan"); setPlanOpen(false); }}
        />
      )}

      {manualOpen && (
        <PickExerciseModal
          onClose={() => setManualOpen(false)}
          onPick={(ids) => { addExercises(ids, "manual"); setManualOpen(false); }}
        />
      )}
    </div>
  );
}

function PickPlanModal({ onClose, onPick }: { onClose: () => void; onPick: (ids: string[]) => void }) {
  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => fetch("/api/plans").then((r) => r.json()),
  });

  const handlePick = (plan: Plan) => {
    const ids = plan.items?.map((i) => i.exerciseId) ?? [];
    onPick(ids);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">Pilih Rencana</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {!plans?.length ? (
            <div className="text-sm text-muted-foreground text-center py-6">Belum ada rencana.</div>
          ) : plans.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p)}
              className="w-full text-left p-3 border rounded-xl hover:bg-off transition"
            >
              <div className="font-medium text-ink">{p.title}</div>
              {p.description && (
                <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">{p.items?.length ?? 0} latihan</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-off transition">
          Batal
        </button>
      </div>
    </div>
  );
}

function PickExerciseModal({ onClose, onPick }: { onClose: () => void; onPick: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () => fetch("/api/exercises").then((r) => r.json()),
  });

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleAdd = () => {
    if (selected.size === 0) return toast.error("Pilih minimal satu latihan");
    onPick([...selected]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">Pilih Latihan</h2>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {!exercises?.length ? (
            <div className="text-sm text-muted-foreground text-center py-6">Belum ada latihan di pustaka.</div>
          ) : exercises.map((ex) => (
            <label key={ex.id} className="flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer hover:bg-off transition">
              <input
                type="checkbox"
                checked={selected.has(ex.id)}
                onChange={() => toggle(ex.id)}
                className="accent-primary-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{ex.name}</div>
                <div className="text-xs text-muted-foreground">{exerciseDetail(ex)}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-off transition">
            Batal
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition"
          >
            Tambah ({selected.size})
          </button>
        </div>
      </div>
    </div>
  );
}

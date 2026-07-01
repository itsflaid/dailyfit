"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Plus, ListChecks, CalendarCheck2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateLabel, getTodayDate } from "@/lib/utils";
import { exerciseDetail, CATEGORY_LABEL, type DailyLog, type Exercise, type Plan } from "@/types";

interface StatsData {
  streak: number;
  previousStreak?: number;
  totalWeek: number;
  completedWeek: number;
  totalMonth: number;
  completedMonth: number;
  activeDaysMonth: number;
  weeklyData: { day: string; total: number; completed: number }[];
  monthlyData: Array<Record<string, number | null>>;
  topExercises: { name: string; count: number }[];
  allExercises: { name: string; count: number }[];
  categoryData: { name: string; value: number }[];
}

type StatsSnapshot = [QueryKey, StatsData | undefined][];

function updateCachedStats(
  qc: ReturnType<typeof useQueryClient>,
  date: string,
  update: (stats: StatsData, includesMonth: boolean) => StatsData
) {
  const month = date.slice(0, 7);
  qc.getQueriesData<StatsData>({ queryKey: ["stats"] }).forEach(([key, stats]) => {
    if (!stats) return;
    const selectedMonth = typeof key[1] === "string" ? key[1] : month;
    qc.setQueryData(key, update(stats, selectedMonth === month));
  });
}

function updateExerciseCount(
  items: { name: string; count: number }[],
  name: string,
  delta: number
) {
  const next = items.map((item) =>
    item.name === name ? { ...item, count: Math.max(0, item.count + delta) } : item
  );
  if (delta > 0 && !next.some((item) => item.name === name)) {
    next.push({ name, count: delta });
  }
  return next.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
}

function updateCategoryCount(
  items: { name: string; value: number }[],
  name: string,
  delta: number
) {
  const next = items.map((item) =>
    item.name === name ? { ...item, value: Math.max(0, item.value + delta) } : item
  );
  if (delta > 0 && !next.some((item) => item.name === name)) {
    next.push({ name, value: delta });
  }
  return next.filter((item) => item.value > 0);
}

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
    onMutate: async ({ id, current }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["daily", date] }),
        qc.cancelQueries({ queryKey: ["stats"] }),
        qc.cancelQueries({ queryKey: ["heatmap"] }),
      ]);

      const previousLog = qc.getQueryData<DailyLog>(["daily", date]);
      const previousStats = qc.getQueriesData<StatsData>({ queryKey: ["stats"] });
      const previousHeatmap = qc.getQueryData<Record<string, number>>(["heatmap"]);
      const item = previousLog?.items.find((entry) => entry.id === id);
      const checkedBefore = previousLog?.items.filter((entry) => entry.isChecked).length ?? 0;
      const delta = current ? -1 : 1;

      qc.setQueryData<DailyLog>(["daily", date], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) =>
            i.id === id ? { ...i, isChecked: !current } : i
          ),
        };
      });

      if (item) {
        updateCachedStats(qc, date, (stats, includesMonth) => {
          const allExercises = updateExerciseCount(
            stats.allExercises,
            item.exercise.name,
            delta
          );
          const day = Number(date.slice(8, 10));
          const monthlyData = includesMonth
            ? stats.monthlyData.map((entry) =>
                entry.date === day
                  ? {
                      ...entry,
                      [item.exercise.category]: Math.max(
                        0,
                        Number(entry[item.exercise.category] ?? 0) + delta
                      ),
                    }
                  : entry
              )
            : stats.monthlyData;

          return {
            ...stats,
            streak:
              checkedBefore === 0 && delta > 0
                ? (stats.previousStreak ?? 0) + 1
                : checkedBefore === 1 && delta < 0
                  ? 0
                  : stats.streak,
            completedWeek: Math.max(0, stats.completedWeek + delta),
            completedMonth: includesMonth
              ? Math.max(0, stats.completedMonth + delta)
              : stats.completedMonth,
            activeDaysMonth: includesMonth
              ? Math.max(
                  0,
                  stats.activeDaysMonth +
                    (checkedBefore === 0 && delta > 0
                      ? 1
                      : checkedBefore === 1 && delta < 0
                        ? -1
                        : 0)
                )
              : stats.activeDaysMonth,
            weeklyData: stats.weeklyData.map((entry, index) =>
              index === stats.weeklyData.length - 1
                ? { ...entry, completed: Math.max(0, entry.completed + delta) }
                : entry
            ),
            monthlyData,
            allExercises,
            topExercises: allExercises.slice(0, 5),
            categoryData: updateCategoryCount(
              stats.categoryData,
              item.exercise.category,
              delta
            ),
          };
        });

        qc.setQueryData<Record<string, number>>(["heatmap"], (old) =>
          old ? { ...old, [date]: Math.max(0, (old[date] ?? 0) + delta) } : old
        );
      }

      return { previousLog, previousStats, previousHeatmap };
    },
    onError: (_error, _variables, context) => {
      qc.setQueryData(["daily", date], context?.previousLog);
      context?.previousStats.forEach(([key, stats]) => qc.setQueryData(key, stats));
      qc.setQueryData(["heatmap"], context?.previousHeatmap);
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
      exercises,
      source,
    }: {
      exercises: Exercise[];
      source: "plan" | "manual";
    }) => {
      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, exerciseIds: exercises.map((exercise) => exercise.id), source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Gagal menambahkan");
      return data as DailyLog & { added?: number };
    },
    onMutate: async ({ exercises, source }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ["daily", date] }),
        qc.cancelQueries({ queryKey: ["stats"] }),
      ]);

      const previousLog = qc.getQueryData<DailyLog>(["daily", date]);
      const previousStats: StatsSnapshot = qc.getQueriesData<StatsData>({ queryKey: ["stats"] });
      const existingIds = new Set(previousLog?.items.map((item) => item.exerciseId) ?? []);
      const fresh = exercises.filter((exercise) => !existingIds.has(exercise.id));
      const maxOrder = previousLog?.items.reduce((max, item) => Math.max(max, item.order), -1) ?? -1;

      if (fresh.length > 0) {
        const optimisticItems: DailyLog["items"] = fresh.map((exercise, index) => ({
          id: `optimistic-${exercise.id}-${Date.now()}`,
          dailyLogId: previousLog?.id ?? `optimistic-${date}`,
          exerciseId: exercise.id,
          isChecked: false,
          order: maxOrder + index + 1,
          source,
          exercise,
        }));

        qc.setQueryData<DailyLog>(["daily", date], (old) => ({
          id: old?.id ?? `optimistic-${date}`,
          userId: old?.userId ?? "",
          date: old?.date ?? date,
          items: [...optimisticItems].reverse().concat(old?.items ?? []),
        }));

        updateCachedStats(qc, date, (stats, includesMonth) => ({
          ...stats,
          totalWeek: stats.totalWeek + fresh.length,
          totalMonth: includesMonth ? stats.totalMonth + fresh.length : stats.totalMonth,
          weeklyData: stats.weeklyData.map((entry, index) =>
            index === stats.weeklyData.length - 1
              ? { ...entry, total: entry.total + fresh.length }
              : entry
          ),
        }));
      }

      return { previousLog, previousStats };
    },
    onSuccess: (data) => {
      if (data.added === 0) {
        toast.info("Latihan sudah ada di hari ini");
        return;
      }

      qc.setQueryData<DailyLog>(["daily", date], data);
      toast.success("Latihan ditambahkan");
    },
    onError: (_error, _variables, context) => {
      qc.setQueryData(["daily", date], context?.previousLog);
      context?.previousStats.forEach(([key, stats]) => qc.setQueryData(key, stats));
      toast.error("Gagal menambahkan");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["daily", date] });
      refreshProgressCaches();
    },
  });

  const toggle = (id: string, current: boolean) => {
    toggleMutation.mutate({ id, current });
  };

  const addExercises = async (exercises: Exercise[], source: "plan" | "manual") => {
    await addMutation.mutateAsync({ exercises, source });
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
          {items.map((item) => {
            const isPending = item.id.startsWith("optimistic-");
            return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 flex items-center gap-3 transition shadow-sm ${
                isPending ? "bg-off animate-shimmer" : "bg-white"
              } ${item.isChecked ? "opacity-70" : ""}`}
            >
              <button
                onClick={() => { if (!isPending) toggle(item.id, item.isChecked); }}
                disabled={isPending}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                  isPending
                    ? "border-primary-400 animate-pulse"
                    : item.isChecked
                      ? "bg-primary-600 border-primary-600"
                      : "border-slate-300 hover:border-primary-400"
                }`}
              >
                {item.isChecked && !isPending && <Check className="h-3.5 w-3.5 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className={`font-medium text-ink ${item.isChecked ? "line-through text-muted-foreground" : ""}`}>
                  {item.exercise.name}
                </div>
                {isPending ? (
                  <div className="text-xs text-primary-600/70 italic mt-0.5">Menambahkan gerakan…</div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {exerciseDetail(item.exercise)}
                  </div>
                )}
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
          );
          })}
        </div>
      )}

      {planOpen && (
        <PickPlanModal
          onClose={() => setPlanOpen(false)}
          onPick={async (ids) => { await addExercises(ids, "plan"); setPlanOpen(false); }}
        />
      )}

      {manualOpen && (
        <PickExerciseModal
          onClose={() => setManualOpen(false)}
          onPick={async (ids) => { await addExercises(ids, "manual"); setManualOpen(false); }}
        />
      )}
    </div>
  );
}

function PickPlanModal({ onClose, onPick }: { onClose: () => void; onPick: (exercises: Exercise[]) => Promise<void> }) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: () => fetch("/api/plans").then((r) => r.json()),
  });

  const handlePick = async (plan: Plan) => {
    if (submittingId) return;
    const exercises = plan.items?.flatMap((item) => item.exercise ? [item.exercise] : []) ?? [];
    setSubmittingId(plan.id);
    try {
      await onPick(exercises);
    } catch {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submittingId && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">Pilih Rencana</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {!plans?.length ? (
            <div className="text-sm text-muted-foreground text-center py-6">Belum ada rencana.</div>
          ) : plans.map((p) => {
            const isThisSubmitting = submittingId === p.id;
            const isDimmed = submittingId !== null && !isThisSubmitting;
            return (
              <button
                key={p.id}
                onClick={() => handlePick(p)}
                disabled={submittingId !== null}
                className={`w-full text-left p-3 border rounded-xl transition ${
                  isThisSubmitting ? "bg-primary-50 border-primary-200" : "hover:bg-off"
                } ${isDimmed ? "opacity-40" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-ink">{p.title}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {isThisSubmitting ? "Menambahkan…" : `${p.items?.length ?? 0} latihan`}
                    </div>
                  </div>
                  {isThisSubmitting && (
                    <span className="flex gap-0.5 flex-shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600 animate-bounce" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          disabled={submittingId !== null}
          className="w-full py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-off transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

function PickExerciseModal({ onClose, onPick }: { onClose: () => void; onPick: (exercises: Exercise[]) => Promise<void> }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () => fetch("/api/exercises").then((r) => r.json()),
  });

  const toggle = (id: string) => {
    if (isSubmitting) return;
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const handleAdd = async () => {
    if (selected.size === 0) return toast.error("Pilih minimal satu latihan");
    setIsSubmitting(true);
    try {
      await onPick((exercises ?? []).filter((exercise) => selected.has(exercise.id)));
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-ink">Pilih Latihan</h2>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {!exercises?.length ? (
            <div className="text-sm text-muted-foreground text-center py-6">Belum ada latihan di pustaka.</div>
          ) : exercises.map((ex) => (
            <label
              key={ex.id}
              className={`flex items-center gap-3 p-2.5 border rounded-xl transition ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-off"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(ex.id)}
                onChange={() => toggle(ex.id)}
                disabled={isSubmitting}
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
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-slate-600 hover:bg-off transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition disabled:hover:bg-primary-600"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                Menambahkan
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1 w-1 rounded-full bg-white animate-bounce" />
                </span>
              </span>
            ) : (
              `Tambah (${selected.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

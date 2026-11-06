import { prisma } from "@/lib/prisma";
import { ExerciseCategory } from "@prisma/client";
import { addDaysToKey, keyToLocalDate, keyToUtcDate } from "@/lib/dates";

export type MonthlyReportExerciseLine = {
  name: string;
  amount: number;
  unit: "x" | "detik";
  category: ExerciseCategory;
};

export type MonthlyReportDay = {
  dayNumber: number;
  date: Date;
  exercises: MonthlyReportExerciseLine[];
  totalCount: number;
};

export type MonthlyReportSummary = {
  daysTrained: number;
  totalExercises: number;
  topExercise: { name: string; count: number } | null;
  categoryBreakdown: { category: ExerciseCategory; count: number }[];
};

export type MonthlyReportData = {
  userName: string;
  periodLabel: string;
  generatedAt: Date;
  days: MonthlyReportDay[];
  summary: MonthlyReportSummary;
};

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  STRENGTH: "Kekuatan",
  CARDIO: "Kardio",
  BALANCE: "Keseimbangan",
  FLEXIBILITY: "Fleksibilitas",
};

function formatPeriodLabel(from: Date, to: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const fromLabel = from.toLocaleDateString("id-ID", opts);
  const toLabel = to.toLocaleDateString("id-ID", { ...opts, year: "numeric" });
  return `${fromLabel} - ${toLabel}`;
}

export async function getMonthlyReportData(
  userId: string,
  userName: string,
  todayKey: string
): Promise<MonthlyReportData> {
  const DAY_WINDOW = 30;
  const startKey = addDaysToKey(todayKey, -(DAY_WINDOW - 1));

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: keyToUtcDate(startKey), lte: keyToUtcDate(todayKey) } },
    relationLoadStrategy: "join",
    include: {
      items: {
        where: { isChecked: true },
        include: { exercise: true },
      },
    },
  });

  const logsByDateKey = new Map(logs.map((log) => [log.date.toISOString().slice(0, 10), log]));

  const days: MonthlyReportDay[] = [];
  const exerciseCountAll: Record<string, { name: string; count: number }> = {};
  const categoryCount: Record<ExerciseCategory, number> = {
    STRENGTH: 0,
    CARDIO: 0,
    BALANCE: 0,
    FLEXIBILITY: 0,
  };
  let daysTrained = 0;
  let totalExercises = 0;

  for (let i = 0; i < DAY_WINDOW; i++) {
    const dayKey = addDaysToKey(todayKey, -i);
    const date = keyToLocalDate(dayKey);
    const log = logsByDateKey.get(dayKey);

    const grouped = new Map<string, MonthlyReportExerciseLine>();
    for (const item of log?.items ?? []) {
      const ex = item.exercise;
      const isTimeBased = ex.type === "TIME_BASED";
      const amount = isTimeBased
        ? ex.durationSeconds ?? 0
        : (ex.reps ?? 0) * (ex.sets ?? 1);

      const existing = grouped.get(ex.id);
      if (existing) {
        existing.amount += amount;
      } else {
        grouped.set(ex.id, {
          name: ex.name,
          amount,
          unit: isTimeBased ? "detik" : "x",
          category: ex.category,
        });
      }

      exerciseCountAll[ex.id] = exerciseCountAll[ex.id]
        ? { name: ex.name, count: exerciseCountAll[ex.id].count + 1 }
        : { name: ex.name, count: 1 };
      categoryCount[ex.category] += 1;
      totalExercises += 1;
    }

    const exercises = Array.from(grouped.values());
    if (exercises.length > 0) daysTrained += 1;

    days.push({
      dayNumber: i + 1,
      date,
      exercises,
      totalCount: exercises.length,
    });
  }

  const topExerciseEntry = Object.values(exerciseCountAll).sort((a, b) => b.count - a.count)[0] ?? null;

  return {
    userName,
    periodLabel: formatPeriodLabel(keyToLocalDate(startKey), keyToLocalDate(todayKey)),
    generatedAt: keyToLocalDate(todayKey),
    days,
    summary: {
      daysTrained,
      totalExercises,
      topExercise: topExerciseEntry,
      categoryBreakdown: (Object.keys(categoryCount) as ExerciseCategory[])
        .map((category) => ({ category, count: categoryCount[category] }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count),
    },
  };
}

export { CATEGORY_LABEL };

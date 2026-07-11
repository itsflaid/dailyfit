import { prisma } from "@/lib/prisma";
import { ExerciseCategory } from "@prisma/client";

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

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRolling30DateRange() {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start, end };
}

function formatPeriodLabel(from: Date, to: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  const fromLabel = from.toLocaleDateString("id-ID", opts);
  const toLabel = to.toLocaleDateString("id-ID", { ...opts, year: "numeric" });
  return `${fromLabel} - ${toLabel}`;
}

export async function getMonthlyReportData(userId: string, userName: string): Promise<MonthlyReportData> {
  const { start, end } = getRolling30DateRange();
  const DAY_WINDOW = 30;

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: start, lte: end } },
    include: {
      items: {
        where: { isChecked: true },
        include: { exercise: true },
      },
    },
  });

  const logsByDateKey = new Map(logs.map((log) => [startOfDay(log.date).toISOString(), log]));

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
    const date = new Date(end);
    date.setDate(date.getDate() - i);
    const log = logsByDateKey.get(startOfDay(date).toISOString());

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
    periodLabel: formatPeriodLabel(start, end),
    generatedAt: new Date(),
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

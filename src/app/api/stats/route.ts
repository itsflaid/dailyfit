import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ─── Resolve selected month ────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month"); // "YYYY-MM" | null

  const refDate = monthParam
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date(today.getFullYear(), today.getMonth(), 1);

  // Guard: invalid date string → fall back to current month
  const safeRefDate = isNaN(refDate.getTime())
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : refDate;

  const firstDayOfMonth = new Date(
    safeRefDate.getFullYear(),
    safeRefDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    safeRefDate.getFullYear(),
    safeRefDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const daysInMonth = lastDayOfMonth.getDate();

  // ─── Date boundaries ─────────────────────────────────────────────────────
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const streakStart = new Date(today);
  streakStart.setDate(today.getDate() - 364);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // ─── Parallel queries ─────────────────────────────────────────────────────
  const [weekLogs, monthLogs, activeLogs, exerciseGroups] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      include: { items: { include: { exercise: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: firstDayOfMonth, lte: lastDayOfMonth } },
      include: { items: { include: { exercise: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.dailyLog.findMany({
      where: {
        userId,
        date: { gte: streakStart, lt: tomorrow },
        items: { some: { isChecked: true } },
      },
      select: { date: true },
    }),
    prisma.dailyLogItem.groupBy({
      by: ["exerciseId"],
      where: { dailyLog: { userId }, isChecked: true },
      _count: { exerciseId: true },
      orderBy: { _count: { exerciseId: "desc" } },
    }),
  ]);

  // ─── Weekly chart ─────────────────────────────────────────────────────────
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const log = weekLogs.find(
      (l) => new Date(l.date).toDateString() === d.toDateString()
    );
    return {
      day: dayNames[d.getDay()],
      total: log?.items.length ?? 0,
      completed: log?.items.filter((it) => it.isChecked).length ?? 0,
    };
  });

  const weekItems = weekLogs.flatMap((l) => l.items);
  const totalWeek = weekItems.length;
  const completedWeek = weekItems.filter((i) => i.isChecked).length;

  // ─── Monthly chart per category per day ───────────────────────────────────
  const CATEGORIES = ["STRENGTH", "CARDIO", "BALANCE", "FLEXIBILITY"] as const;

  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(
      safeRefDate.getFullYear(),
      safeRefDate.getMonth(),
      i + 1
    );
    const isFuture = d > today;

    if (isFuture) return { date: i + 1 };

    const log = monthLogs.find(
      (l) => new Date(l.date).toDateString() === d.toDateString()
    );
    const checkedItems = log?.items.filter((it) => it.isChecked) ?? [];

    const entry: Record<string, number | null> = { date: i + 1 };
    for (const cat of CATEGORIES) {
      entry[cat] = checkedItems.filter(
        (it) => it.exercise.category === cat
      ).length;
    }
    return entry;
  });

  // ─── Monthly summary ─────────────────────────────────────────────────────
  const monthItems = monthLogs.flatMap((l) => l.items);
  const totalMonth = monthItems.length;
  const completedMonth = monthItems.filter((i) => i.isChecked).length;
  const activeDaysMonth = monthLogs.filter((l) =>
    l.items.some((i) => i.isChecked)
  ).length;
  const monthName = safeRefDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // ─── Streak ──────────────────────────────────────────────────────────────
  const activeDates = new Set(
    activeLogs.map((log) => new Date(log.date).toDateString())
  );

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (!activeDates.has(date.toDateString())) break;
    streak++;
  }

  let previousStreak = 0;
  for (let i = 1; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    if (!activeDates.has(date.toDateString())) break;
    previousStreak++;
  }

  // ─── Top exercises & categories (via groupBy) ────────────────────────────
  const exerciseIds = exerciseGroups.map((g) => g.exerciseId);
  const exercisesMeta = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true, category: true },
  });
  const exerciseMetaMap = new Map(exercisesMeta.map((e) => [e.id, e]));

  const allExercises = exerciseGroups.map((g) => ({
    name: exerciseMetaMap.get(g.exerciseId)?.name ?? "Unknown",
    count: g._count.exerciseId,
  }));
  const topExercises = allExercises.slice(0, 5);

  const categoryCount: Record<string, number> = {};
  for (const g of exerciseGroups) {
    const cat = exerciseMetaMap.get(g.exerciseId)?.category;
    if (!cat) continue;
    categoryCount[cat] = (categoryCount[cat] ?? 0) + g._count.exerciseId;
  }
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));

  return NextResponse.json(
    {
      streak,
      previousStreak,
      totalWeek,
      completedWeek,
      totalMonth,
      completedMonth,
      activeDaysMonth,
      monthName,
      weeklyData,
      monthlyData,
      topExercises,
      allExercises,
      categoryData,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

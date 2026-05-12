import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  // --- Weekly ---
  const weekLogs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { items: { include: { exercise: true } } },
    orderBy: { date: "asc" },
  });

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const log = weekLogs.find((l) => new Date(l.date).toDateString() === d.toDateString());
    return {
      day: dayNames[d.getDay()],
      total: log?.items.length ?? 0,
      completed: log?.items.filter((it) => it.isChecked).length ?? 0,
    };
  });

  // --- Monthly chart per category per day ---
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const monthLogs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: firstDayOfMonth } },
    include: { items: { include: { exercise: true } } },
    orderBy: { date: "asc" },
  });

  const CATEGORIES = ["STRENGTH", "CARDIO", "BALANCE", "FLEXIBILITY"] as const;

  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
    const isFuture = d > today;
    if (isFuture) return { date: i + 1 };

    const log = monthLogs.find((l) => new Date(l.date).toDateString() === d.toDateString());
    const checkedItems = log?.items.filter((it) => it.isChecked) ?? [];

    const entry: Record<string, number | null> = { date: i + 1 };
    for (const cat of CATEGORIES) {
      entry[cat] = checkedItems.filter((it) => it.exercise.category === cat).length;
    }
    return entry;
  });

  // Monthly summary
  const monthItems = monthLogs.flatMap((l) => l.items);
  const totalMonth = monthItems.length;
  const completedMonth = monthItems.filter((i) => i.isChecked).length;
  const activeDaysMonth = monthLogs.filter((l) => l.items.some((i) => i.isChecked)).length;
  const monthName = today.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  // --- Streak ---
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    const log = await prisma.dailyLog.findFirst({
      where: { userId, date: { gte: d, lt: nextD } },
      include: { items: true },
    });
    if (log && log.items.some((it) => it.isChecked)) streak++;
    else break;
  }

  // --- All exercises ---
  const allItems = await prisma.dailyLogItem.findMany({
    where: { dailyLog: { userId }, isChecked: true },
    include: { exercise: true },
  });

  const exerciseCount: Record<string, { name: string; count: number }> = {};
  for (const item of allItems) {
    if (!exerciseCount[item.exerciseId]) {
      exerciseCount[item.exerciseId] = { name: item.exercise.name, count: 0 };
    }
    exerciseCount[item.exerciseId].count++;
  }
  const allExercises = Object.values(exerciseCount).sort((a, b) => b.count - a.count);
  const topExercises = allExercises.slice(0, 5);

  const categoryCount: Record<string, number> = {};
  for (const item of allItems) {
    const cat = item.exercise.category;
    categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
  }
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  const weekItems = weekLogs.flatMap((l) => l.items);
  const totalWeek = weekItems.length;
  const completedWeek = weekItems.filter((i) => i.isChecked).length;

  return NextResponse.json({
    streak, totalWeek, completedWeek,
    totalMonth, completedMonth, activeDaysMonth, monthName,
    weeklyData, monthlyData,
    topExercises, allExercises, categoryData,
  });
}
export const CATEGORIES = ["STRENGTH", "CARDIO", "BALANCE", "FLEXIBILITY"] as const;

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export type DayRow = { day: string; category: string; total: number; done: number };
export type ExerciseRow = { name: string; category: string; count: number };

const keyOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const msOf = (key: string) => Date.parse(`${key}T00:00:00Z`);

export function resolveToday(param: string | null): string {
  return param && DATE_RE.test(param) && !isNaN(msOf(param))
    ? param
    : new Date().toISOString().slice(0, 10);
}

export function resolveMonth(param: string | null, todayKey: string): string {
  return param && MONTH_RE.test(param) ? param : todayKey.slice(0, 7);
}

export function statsWindow(todayKey: string, month: string) {
  const todayMs = msOf(todayKey);
  const [y, m] = month.split("-").map(Number);
  return {
    yearStart: keyOf(todayMs - 364 * DAY_MS),
    today: todayKey,
    monthStart: keyOf(Date.UTC(y, m - 1, 1)),
    monthEnd: keyOf(Date.UTC(y, m, 1)),
  };
}

export function buildStats(
  rows: DayRow[],
  exerciseRows: ExerciseRow[],
  todayKey: string,
  month: string
) {
  const todayMs = msOf(todayKey);
  const [y, m] = month.split("-").map(Number);
  const monthStartMs = Date.UTC(y, m - 1, 1);
  const daysInMonth = (Date.UTC(y, m, 1) - monthStartMs) / DAY_MS;

  const byDay = new Map<string, { total: number; done: number; cat: Record<string, number> }>();
  for (const r of rows) {
    const d = byDay.get(r.day) ?? { total: 0, done: 0, cat: {} };
    d.total += r.total;
    d.done += r.done;
    d.cat[r.category] = (d.cat[r.category] ?? 0) + r.done;
    byDay.set(r.day, d);
  }

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const ms = todayMs - (6 - i) * DAY_MS;
    const d = byDay.get(keyOf(ms));
    return {
      day: DAY_NAMES[new Date(ms).getUTCDay()],
      total: d?.total ?? 0,
      completed: d?.done ?? 0,
    };
  });
  const totalWeek = weeklyData.reduce((s, d) => s + d.total, 0);
  const completedWeek = weeklyData.reduce((s, d) => s + d.completed, 0);

  let totalMonth = 0;
  let completedMonth = 0;
  let activeDaysMonth = 0;
  const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
    const ms = monthStartMs + i * DAY_MS;
    const d = byDay.get(keyOf(ms));
    if (d) {
      totalMonth += d.total;
      completedMonth += d.done;
      if (d.done > 0) activeDaysMonth++;
    }
    if (ms > todayMs) return { date: i + 1 } as Record<string, number>;
    const entry: Record<string, number> = { date: i + 1 };
    for (const c of CATEGORIES) entry[c] = d?.cat[c] ?? 0;
    return entry;
  });

  const isActive = (ms: number) => (byDay.get(keyOf(ms))?.done ?? 0) > 0;
  let streak = 0;
  while (streak < 365 && isActive(todayMs - streak * DAY_MS)) streak++;
  let previousStreak = 0;
  while (previousStreak < 364 && isActive(todayMs - (previousStreak + 1) * DAY_MS)) previousStreak++;

  const allExercises = exerciseRows.map((e) => ({ name: e.name, count: e.count }));
  const categoryCount: Record<string, number> = {};
  for (const e of exerciseRows) categoryCount[e.category] = (categoryCount[e.category] ?? 0) + e.count;

  return {
    streak,
    previousStreak,
    totalWeek,
    completedWeek,
    totalMonth,
    completedMonth,
    activeDaysMonth,
    monthName: new Date(monthStartMs).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    weeklyData,
    monthlyData,
    topExercises: allExercises.slice(0, 5),
    allExercises,
    categoryData: Object.entries(categoryCount).map(([name, value]) => ({ name, value })),
  };
}

export function buildHeatmap(rows: { day: string; done: number }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.day] = (map[r.day] ?? 0) + r.done;
  return map;
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  buildStats,
  resolveMonth,
  resolveToday,
  statsWindow,
  type DayRow,
  type ExerciseRow,
} from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const todayKey = resolveToday(searchParams.get("today"));
  const month = resolveMonth(searchParams.get("month"), todayKey);
  const w = statsWindow(todayKey, month);

  const [rows, exerciseRows] = await Promise.all([
    prisma.$queryRaw<DayRow[]>`
      SELECT to_char(l.date, 'YYYY-MM-DD') AS day,
             e.category::text AS category,
             COUNT(*)::int AS total,
             (COUNT(*) FILTER (WHERE i."isChecked"))::int AS done
      FROM daily_logs l
      JOIN daily_log_items i ON i."dailyLogId" = l.id
      JOIN exercises e ON e.id = i."exerciseId"
      WHERE l."userId" = ${userId}
        AND ((l.date >= ${w.yearStart}::date AND l.date <= ${w.today}::date)
          OR (l.date >= ${w.monthStart}::date AND l.date < ${w.monthEnd}::date))
      GROUP BY l.date, e.category`,
    prisma.$queryRaw<ExerciseRow[]>`
      SELECT e.name, e.category::text AS category, COUNT(*)::int AS count
      FROM daily_log_items i
      JOIN exercises e ON e.id = i."exerciseId"
      WHERE e."userId" = ${userId} AND i."isChecked"
      GROUP BY e.id, e.name, e.category
      ORDER BY count DESC, e.name ASC`,
  ]);

  return NextResponse.json(buildStats(rows, exerciseRows, todayKey, month), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

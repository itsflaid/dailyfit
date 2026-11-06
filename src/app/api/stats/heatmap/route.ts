import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { buildHeatmap, resolveToday, statsWindow } from "@/lib/stats";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const todayKey = resolveToday(new URL(req.url).searchParams.get("today"));
  const w = statsWindow(todayKey, todayKey.slice(0, 7));

  const rows = await prisma.$queryRaw<{ day: string; done: number }[]>`
    SELECT to_char(l.date, 'YYYY-MM-DD') AS day,
           (COUNT(*) FILTER (WHERE i."isChecked"))::int AS done
    FROM daily_logs l
    JOIN daily_log_items i ON i."dailyLogId" = l.id
    WHERE l."userId" = ${session.user.id}
      AND l.date >= ${w.yearStart}::date AND l.date <= ${w.today}::date
    GROUP BY l.date`;

  return NextResponse.json(buildHeatmap(rows));
}

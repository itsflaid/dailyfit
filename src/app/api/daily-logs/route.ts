import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isDateKey } from "@/lib/dates";
import { findDailyLog } from "@/lib/daily-logs";
import { takeSnapshot } from "@/lib/log-items";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!isDateKey(date)) {
    return NextResponse.json({ message: "Date tidak valid" }, { status: 400 });
  }

  const log = await findDailyLog(session.user.id, new Date(date));

  return NextResponse.json(log ?? { items: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const { date, exerciseIds, source } = body ?? {};
  if (!isDateKey(date) || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
    return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
  }

  const dateObj = new Date(date);
  const ids = [...new Set(exerciseIds.filter((v): v is string => typeof v === "string"))];

  const [log, owned, agg] = await Promise.all([
    prisma.dailyLog.upsert({
      where: { userId_date: { userId, date: dateObj } },
      create: { userId, date: dateObj },
      update: {},
      select: { id: true },
    }),
    prisma.exercise.findMany({ where: { id: { in: ids }, userId, deletedAt: null } }),
    prisma.dailyLogItem.aggregate({
      where: { dailyLog: { userId, date: dateObj } },
      _max: { order: true },
    }),
  ]);

  const ownedById = new Map(owned.map((e) => [e.id, e]));
  const valid = ids.flatMap((id) => ownedById.get(id) ?? []);
  if (valid.length === 0) {
    return NextResponse.json({ message: "Latihan tidak valid" }, { status: 400 });
  }

  const base = (agg._max.order ?? -1) + 1;
  const { count } = await prisma.dailyLogItem.createMany({
    data: valid.map((exercise, i) => ({
      dailyLogId: log.id,
      exerciseId: exercise.id,
      snapshot: takeSnapshot(exercise),
      order: base + i,
      source: source === "plan" ? "plan" : "manual",
    })),
    skipDuplicates: true,
  });

  if (count === 0) return NextResponse.json({ message: "Semua latihan sudah ada", added: 0 });

  const updated = await findDailyLog(userId, dateObj);

  return NextResponse.json({ ...updated, added: count }, { status: 201 });
}

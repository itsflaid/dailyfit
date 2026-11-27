import prisma from "@/lib/prisma";
import { applySnapshot } from "@/lib/log-items";

export async function findDailyLog(userId: string, date: Date) {
  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date } },
    relationLoadStrategy: "join",
    include: { items: { include: { exercise: true }, orderBy: { order: "desc" } } },
  });
  return log && { ...log, items: log.items.map(applySnapshot) };
}

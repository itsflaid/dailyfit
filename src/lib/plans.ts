import prisma from "@/lib/prisma";
import { uniqueIds } from "@/lib/validation";

export async function ownedPlanItems(userId: string, exerciseIds: unknown) {
  const requested = uniqueIds(exerciseIds);
  const owned = await prisma.exercise.findMany({
    where: { id: { in: requested }, userId, deletedAt: null },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((e) => e.id));
  return requested
    .filter((id) => ownedIds.has(id))
    .map((exerciseId, order) => ({ exerciseId, order }));
}

export const planWithItems = {
  items: { include: { exercise: true }, orderBy: { order: "asc" as const } },
};

export function cleanDescription(value: unknown): string | null {
  return typeof value === "string" ? value.trim().slice(0, 500) || null : null;
}

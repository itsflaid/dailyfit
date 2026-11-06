import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const plans = await prisma.plan.findMany({
    where: { userId },
    relationLoadStrategy: "join",
    include: {
      items: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { title, description, exerciseIds } = await req.json();

  if (!title) return NextResponse.json({ message: "Judul wajib diisi" }, { status: 400 });

  const requested: string[] = Array.isArray(exerciseIds)
    ? exerciseIds.filter((v): v is string => typeof v === "string")
    : [];
  const owned = await prisma.exercise.findMany({
    where: { id: { in: requested }, userId },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((e) => e.id));
  const validIds = requested.filter((id) => ownedIds.has(id));

  const plan = await prisma.plan.create({
    data: {
      userId,
      title,
      description: description ?? null,
      items: {
        create: validIds.map((exerciseId, i) => ({
          exerciseId,
          order: i,
        })),
      },
    },
    include: {
      items: { include: { exercise: true }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(plan, { status: 201 });
}

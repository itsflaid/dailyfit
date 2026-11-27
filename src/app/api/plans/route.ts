import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cleanDescription, ownedPlanItems, planWithItems } from "@/lib/plans";
import { cleanText, readJson } from "@/lib/validation";

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
  const body = await readJson(req);
  const title = cleanText(body?.title);
  if (!body || !title) return NextResponse.json({ message: "Judul wajib diisi" }, { status: 400 });

  const plan = await prisma.plan.create({
    data: {
      userId,
      title,
      description: cleanDescription(body.description),
      items: { create: await ownedPlanItems(userId, body.exerciseIds) },
    },
    include: planWithItems,
  });

  return NextResponse.json(plan, { status: 201 });
}

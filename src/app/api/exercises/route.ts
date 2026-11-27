import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { parseExercise, readJson } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const exercises = await prisma.exercise.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await readJson(req);
  const data = body && parseExercise(body);
  if (!data) return NextResponse.json({ message: "Data latihan tidak valid" }, { status: 400 });

  const exercise = await prisma.exercise.create({
    data: { userId: session.user.id, ...data },
  });

  return NextResponse.json(exercise, { status: 201 });
}

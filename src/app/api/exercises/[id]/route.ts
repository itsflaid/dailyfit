import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { parseExercise, readJson } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id } = await params;
  const body = await readJson(req);

  const existing = await prisma.exercise.findFirst({
    where: { id, userId },
  });
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const data = body && parseExercise({ ...existing, ...body });
  if (!data) return NextResponse.json({ message: "Data latihan tidak valid" }, { status: 400 });

  const exercise = await prisma.exercise.update({ where: { id }, data });

  return NextResponse.json(exercise);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id } = await params;

  const existing = await prisma.exercise.findFirst({
    where: { id, userId },
  });
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ message: "Berhasil dihapus" });
}

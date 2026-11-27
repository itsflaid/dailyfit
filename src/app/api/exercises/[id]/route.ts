import { NextRequest, NextResponse } from "next/server";
import { Prisma, type Exercise } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { keyToUtcDate } from "@/lib/dates";
import { takeSnapshot } from "@/lib/log-items";
import { resolveToday } from "@/lib/stats";
import { parseExercise, readJson } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Item hari ini dan seterusnya yang belum dicentang belum menjadi riwayat.
function pendingItems(exerciseId: string, req: NextRequest) {
  const today = resolveToday(req.nextUrl.searchParams.get("today"));
  return { exerciseId, isChecked: false, dailyLog: { date: { gte: keyToUtcDate(today) } } };
}

// Baris tanpa snapshot dibekukan sebelum latihannya diubah atau diarsipkan.
function freezeLegacyItems(exercise: Exercise) {
  return prisma.dailyLogItem.updateMany({
    where: { exerciseId: exercise.id, snapshot: { equals: Prisma.DbNull } },
    data: { snapshot: takeSnapshot(exercise) },
  });
}

async function findActive(id: string, userId: string) {
  return prisma.exercise.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(req);

  const existing = await findActive(id, session.user.id);
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const data = body && parseExercise({ ...existing, ...body });
  if (!data) return NextResponse.json({ message: "Data latihan tidak valid" }, { status: 400 });

  const [, exercise] = await prisma.$transaction([
    freezeLegacyItems(existing),
    prisma.exercise.update({ where: { id }, data }),
    prisma.dailyLogItem.updateMany({
      where: pendingItems(id, req),
      data: { snapshot: takeSnapshot(data) },
    }),
  ]);

  return NextResponse.json(exercise);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await findActive(id, session.user.id);
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  await prisma.$transaction([
    freezeLegacyItems(existing),
    prisma.dailyLogItem.deleteMany({ where: pendingItems(id, req) }),
    prisma.planItem.deleteMany({ where: { exerciseId: id } }),
    prisma.exercise.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);

  return NextResponse.json({ message: "Berhasil dihapus" });
}

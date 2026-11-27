import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cleanDescription, ownedPlanItems, planWithItems } from "@/lib/plans";
import { cleanText, readJson } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await readJson(req);
  if (!body) return NextResponse.json({ message: "Data tidak valid" }, { status: 400 });

  const existing = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const title = body.title === undefined ? existing.title : cleanText(body.title);
  if (!title) return NextResponse.json({ message: "Judul wajib diisi" }, { status: 400 });

  const items =
    body.exerciseIds === undefined
      ? undefined
      : { deleteMany: {}, create: await ownedPlanItems(session.user.id, body.exerciseIds) };

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      title,
      description:
        body.description === undefined ? undefined : cleanDescription(body.description),
      items,
    },
    include: planWithItems,
  });

  return NextResponse.json(plan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ message: "Berhasil dihapus" });
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isChecked } = await req.json();

  const item = await prisma.dailyLogItem.findFirst({
    where: {
      id,
      dailyLog: { userId: session.user.id },
    },
  });

  if (!item) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  const updated = await prisma.dailyLogItem.update({
    where: { id },
    data: { isChecked },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.dailyLogItem.findFirst({
    where: { id, dailyLog: { userId: session.user.id } },
  });

  if (!item) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  await prisma.dailyLogItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
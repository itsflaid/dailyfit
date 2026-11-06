import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.isChecked !== "boolean") {
    return NextResponse.json({ message: "isChecked harus boolean" }, { status: 400 });
  }

  const { count } = await prisma.dailyLogItem.updateMany({
    where: { id, dailyLog: { userId: session.user.id } },
    data: { isChecked: body.isChecked },
  });
  if (count === 0) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ id, isChecked: body.isChecked });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.dailyLogItem.deleteMany({
    where: { id, dailyLog: { userId: session.user.id } },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { cleanText, readJson } from "@/lib/validation";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await readJson(req);
  const name = body?.name === undefined ? undefined : cleanText(body.name);
  const avatar = body?.avatar === undefined ? undefined : cleanText(body.avatar, 2048);
  if (!body || name === null || avatar === null) {
    return NextResponse.json({ message: "Data tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, avatar },
    select: { id: true, name: true, email: true, avatar: true },
  });

  return NextResponse.json(user);
}

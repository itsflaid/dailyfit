import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Semua field wajib diisi" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ message: "Format email tidak valid" }, { status: 400 });
    }
    // bcrypt hanya memproses 72 byte pertama
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json({ message: "Password harus 8–72 karakter" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, email, password: hashed } });

    return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

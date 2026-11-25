import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const newPassword = String(body?.newPassword ?? "");
  const currentPassword = String(body?.currentPassword ?? "");

  // bcrypt hanya memproses 72 byte pertama
  if (newPassword.length < 8 || newPassword.length > 72) {
    return NextResponse.json(
      { message: "Kata sandi baru harus 8–72 karakter" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });
  if (!user) {
    return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
  }

  // Kalau user masih ingat sandi lama, wajib cocok. Kalau lupa (field kosong),
  // tetap boleh mengganti karena sesi ini sudah terautentikasi.
  if (currentPassword) {
    const valid =
      !!user.password && (await bcrypt.compare(currentPassword, user.password));
    if (!valid) {
      return NextResponse.json(
        { message: "Kata sandi saat ini salah" },
        { status: 400 }
      );
    }
  }

  if (user.password && (await bcrypt.compare(newPassword, user.password))) {
    return NextResponse.json(
      { message: "Kata sandi baru harus berbeda dari yang lama" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return NextResponse.json({ message: "Kata sandi berhasil diperbarui" });
}

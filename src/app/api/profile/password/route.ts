import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { isValidPassword, PASSWORD_RULE } from "@/lib/password";
import { clearRateLimit, hitRateLimit, RATE_LIMITS, tooManyRequests } from "@/lib/rate-limit";
import { forgetSessionVersion } from "@/lib/session-version";
import { readJson } from "@/lib/validation";

const fail = (message: string, status = 400) => NextResponse.json({ message }, { status });

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return fail("Unauthorized", 401);
  const userId = session.user.id;

  const body = await readJson(req);
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (!currentPassword) return fail("Kata sandi saat ini wajib diisi");
  if (!isValidPassword(newPassword)) return fail(PASSWORD_RULE);

  const retryAfter = await hitRateLimit(RATE_LIMITS.password, userId);
  if (retryAfter) return tooManyRequests(retryAfter);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user?.password || !(await bcrypt.compare(currentPassword, user.password))) {
    return fail("Kata sandi saat ini salah");
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    return fail("Kata sandi baru harus berbeda dari yang lama");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await bcrypt.hash(newPassword, 10),
      sessionVersion: { increment: 1 },
    },
  });
  forgetSessionVersion(userId);
  await clearRateLimit(RATE_LIMITS.password, userId);

  return NextResponse.json({ message: "Kata sandi berhasil diperbarui" });
}

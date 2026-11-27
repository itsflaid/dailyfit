// Pemulihan akun oleh pemilik server: npm run user:reset-password -- email@contoh.com
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Pakai: npm run user:reset-password -- <email>");
  process.exit(1);
}

const prisma = new PrismaClient();
const password = randomBytes(12).toString("base64url");

try {
  const { count } = await prisma.user.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data: { password: await bcrypt.hash(password, 10), sessionVersion: { increment: 1 } },
  });
  if (count === 0) {
    console.error(`Akun ${email} tidak ditemukan.`);
    process.exitCode = 1;
  } else {
    console.log(`Kata sandi sementara untuk ${email}: ${password}`);
    console.log("Minta pemilik akun menggantinya dari halaman Profil.");
  }
} finally {
  await prisma.$disconnect();
}

import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";

type Rule = { scope: string; limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  loginAccount: { scope: "login-account", limit: 5, windowSeconds: 15 * 60 },
  loginIp: { scope: "login-ip", limit: 30, windowSeconds: 15 * 60 },
  register: { scope: "register", limit: 5, windowSeconds: 60 * 60 },
  password: { scope: "password", limit: 5, windowSeconds: 15 * 60 },
} satisfies Record<string, Rule>;

// Di Vercel header ini diisi platform. Di server sendiri, pastikan reverse proxy menimpanya.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

const keyFor = (rule: Rule, id: string) =>
  createHash("sha256").update(`${rule.scope}|${id}`).digest("hex");

/** Mencatat satu percobaan. Hasil 0 berarti boleh lanjut, selain itu sisa detik tunggu. */
export async function hitRateLimit(rule: Rule, id: string): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO rate_limits (key, count, "resetAt")
    VALUES (${keyFor(rule, id)}, 1, now() + make_interval(secs => ${rule.windowSeconds}::int))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits."resetAt" <= now() THEN 1 ELSE rate_limits.count + 1 END,
      "resetAt" = CASE WHEN rate_limits."resetAt" <= now() THEN EXCLUDED."resetAt" ELSE rate_limits."resetAt" END
    RETURNING count, CEIL(EXTRACT(EPOCH FROM ("resetAt" - now())))::int AS "retryAfter"`;

  if (Math.random() < 0.01) {
    await prisma.$executeRaw`DELETE FROM rate_limits WHERE "resetAt" <= now()`;
  }

  return row.count > rule.limit ? Math.max(1, row.retryAfter) : 0;
}

export async function clearRateLimit(rule: Rule, id: string) {
  await prisma.rateLimit.deleteMany({ where: { key: keyFor(rule, id) } });
}

export function tooManyRequests(retryAfter: number) {
  const minutes = Math.ceil(retryAfter / 60);
  return Response.json(
    { message: `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

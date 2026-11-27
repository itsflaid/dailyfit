import prisma from "@/lib/prisma";

const TTL_MS = 30_000;
const cache = new Map<string, { version: number; expires: number }>();

// Cache hanya dipercaya saat cocok, jadi sesi baru tidak pernah ditolak karena data basi.
// Sesi yang dicabut paling lama masih diterima instance lain selama TTL_MS.
export async function isSessionCurrent(userId: string, version: number): Promise<boolean> {
  const cached = cache.get(userId);
  if (cached && cached.version === version && cached.expires > Date.now()) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  if (!user) {
    cache.delete(userId);
    return false;
  }

  cache.set(userId, { version: user.sessionVersion, expires: Date.now() + TTL_MS });
  return user.sessionVersion === version;
}

export function forgetSessionVersion(userId: string) {
  cache.delete(userId);
}

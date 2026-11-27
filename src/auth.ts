import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { clearRateLimit, clientIp, hitRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isSessionCurrent } from "@/lib/session-version";

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();

        const ip = clientIp(request);
        const accountId = `${ip}|${email}`;
        if (
          (await hitRateLimit(RATE_LIMITS.loginIp, ip)) ||
          (await hitRateLimit(RATE_LIMITS.loginAccount, accountId))
        ) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;

        await clearRateLimit(RATE_LIMITS.loginAccount, accountId);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
        token.sv = user.sessionVersion;
        return token;
      }
      if (!token.id || !(await isSessionCurrent(token.id, token.sv ?? 0))) return null;
      if (trigger === "update") {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true },
        });
        if (fresh) token.name = fresh.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      return session;
    },
  },
});

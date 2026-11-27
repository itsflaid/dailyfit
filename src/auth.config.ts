import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Halaman auth dialihkan di layout-nya, yang bisa memeriksa apakah sesi sudah dicabut.
    authorized({ auth, request: { nextUrl } }) {
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      return isAuthPage || !!auth?.user;
    },
  },
  providers: [],
};

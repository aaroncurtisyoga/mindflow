import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_EMAIL;
      if (!allowed) return false;
      return profile?.email === allowed;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      if (isAuthApi) return true;
      if (isOnLogin) return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
};

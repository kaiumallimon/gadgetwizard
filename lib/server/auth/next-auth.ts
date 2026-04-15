import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authenticateUserWithPassword } from "@/lib/server/services/auth-service";
import type { UserRole } from "@/lib/server/types";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required behind reverse proxies/CDN and custom domains in production.
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const result = await authenticateUserWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          authUid: result.user.authUid,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.role = user.role as UserRole;
        token.authUid = user.authUid as string;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as {
          id: number;
          role: UserRole;
          authUid: string;
        };

        sessionUser.id = Number(token.id);
        sessionUser.role = (token.role as UserRole) ?? "user";
        sessionUser.authUid = (token.authUid as string) ?? "";
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

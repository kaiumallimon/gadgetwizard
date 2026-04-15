import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/server/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: UserRole;
      authUid: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: UserRole;
    authUid: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: number;
    role?: UserRole;
    authUid?: string;
  }
}

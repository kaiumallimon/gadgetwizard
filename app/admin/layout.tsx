import { redirect } from "next/navigation";

import { requireServerRole } from "@/lib/server/auth/server-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

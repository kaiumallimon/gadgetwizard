import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireServerRole } from "@/lib/server/auth/server-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  return <DashboardShell variant="admin">{children}</DashboardShell>;
}

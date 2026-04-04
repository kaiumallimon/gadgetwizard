import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { requireServerSession } from "@/lib/server/auth/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireServerSession();
  } catch {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  return <DashboardShell variant="user">{children}</DashboardShell>;
}

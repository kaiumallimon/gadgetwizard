import { redirect } from "next/navigation";

import { requireServerSession } from "@/lib/server/auth/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireServerSession();
  } catch {
    redirect("/login");
  }

  return <>{children}</>;
}

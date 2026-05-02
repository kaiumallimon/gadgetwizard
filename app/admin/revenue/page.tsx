import { redirect } from "next/navigation";

import { AdminRevenueDashboard } from "@/components/admin/admin-revenue-dashboard";
import { requireServerRole } from "@/lib/server/auth/server-session";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  try {
    await requireServerRole(["admin"]);
  } catch {
    redirect("/dashboard");
  }

  return <AdminRevenueDashboard />;
}

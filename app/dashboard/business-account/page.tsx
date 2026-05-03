import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getBusinessAccountForUser } from "@/lib/server/services/business-account-service";
import { BusinessAccountApplicationManager } from "@/components/business-account-application-manager";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

export default async function DashboardBusinessAccountPage() {
  const session = await getServerSession();
  if (!session) redirect(buildLoginRedirect("/dashboard/business-account"));
  if (session.role === "admin") redirect("/admin");

  const account = await getBusinessAccountForUser(session.userId);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Business Account</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Apply for business access to unlock wholesale product pricing in business checkout mode.
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-zinc-200 pt-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Business Account</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <BusinessAccountApplicationManager initialAccount={account} />
    </div>
  );
}

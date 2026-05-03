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
import { getUserAddresses } from "@/lib/server/services/address-service";
import { AddressManager } from "@/components/address-manager";
import { buildLoginRedirect } from "@/lib/shared/return-to";

export const dynamic = "force-dynamic";

export default async function DashboardAddressesPage() {
  const session = await getServerSession();
  if (!session) redirect(buildLoginRedirect("/dashboard/addresses"));
  if (session.role === "admin") redirect("/admin");

  const addresses = await getUserAddresses(session.userId);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-900">Saved Addresses</h1>
            <p className="mt-2 text-sm text-zinc-600">Manage your delivery addresses for faster checkout.</p>
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
                <BreadcrumbPage>Addresses</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <AddressManager initialAddresses={addresses} />
    </div>
  );
}

import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server/auth/server-session";
import { getUserAddresses } from "@/lib/server/services/address-service";
import { AddressManager } from "@/components/address-manager";

export const dynamic = "force-dynamic";

export default async function DashboardAddressesPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const addresses = await getUserAddresses(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Saved Addresses</h1>
        <p className="text-sm text-zinc-500">Manage your delivery addresses for faster checkout.</p>
      </div>

      <AddressManager initialAddresses={addresses} />
    </div>
  );
}

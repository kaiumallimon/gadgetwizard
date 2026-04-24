import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminOrders } from "@/lib/server/services/order-service";
import { AdminOrdersManager } from "@/components/admin/admin-orders-manager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireServerRole(["admin"]);

  const result = await getAdminOrders({
    page: 1,
    pageSize: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
        <p className="text-sm text-zinc-500">Track incoming orders and update delivery lifecycle status.</p>
      </div>

      <AdminOrdersManager initialOrders={result.items} />
    </div>
  );
}

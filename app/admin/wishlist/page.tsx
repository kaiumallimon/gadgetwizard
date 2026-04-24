import Link from "next/link";
import { Heart } from "lucide-react";

import { requireServerRole } from "@/lib/server/auth/server-session";
import { getAdminWishlist } from "@/lib/server/services/wishlist-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminWishlistPage() {
  await requireServerRole(["admin"]);

  const result = await getAdminWishlist({
    page: 1,
    pageSize: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
          <Heart className="h-6 w-6" /> Wishlist Activity
        </h1>
        <p className="text-sm text-zinc-500">Track which products users are saving for later.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">No wishlist entries yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">User</th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-zinc-700">Saved At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {result.items.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50/80">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-zinc-900">{entry.userName}</p>
                        <p className="text-xs text-zinc-500">{entry.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link href={`/product/${entry.productSlug}`} className="font-medium text-zinc-900 hover:underline">
                          {entry.productName}
                        </Link>
                        <div className="mt-1">
                          <Badge variant="outline">Product ID: {entry.productId}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 align-top">
                        {new Date(entry.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getWishlistForUser } from "@/lib/server/services/wishlist-service";

export const dynamic = "force-dynamic";

export default async function DashboardWishlistPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  const wishlist = await getWishlistForUser(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900">
          <Heart className="h-6 w-6" /> My Wishlist
        </h1>
        <p className="text-sm text-zinc-500">{wishlist.items.length} saved products</p>
      </div>

      {wishlist.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div>
              <p className="font-medium text-zinc-700">No saved products yet</p>
              <p className="text-sm text-zinc-500">Tap the heart icon on product cards to save items.</p>
            </div>
            <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
              <Link href="/">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlist.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}

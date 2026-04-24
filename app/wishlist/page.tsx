import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getWishlistForUser } from "@/lib/server/services/wishlist-service";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin") {
    redirect("/admin");
  }

  const wishlist = await getWishlistForUser(session.userId);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900">
              <Heart className="h-7 w-7" /> My Wishlist
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{wishlist.items.length} saved products</p>
          </div>
        </div>
      </header>

      {wishlist.items.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
          Your wishlist is empty. Save products you want to revisit.
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {wishlist.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getPublicProductBySlug(slug);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:h-105">
          <img
            src={product.images[0] ?? "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">{product.categoryName}</p>
        <h1 className="text-3xl font-semibold text-white">{product.name}</h1>
        <p className="text-(--muted)">{product.description ?? "No description provided."}</p>

        <div className="space-y-1">
          <p className="text-2xl font-semibold text-white">৳ {product.price.toLocaleString()}</p>
          {product.discountedPrice !== null && (
            <p className="text-sm text-emerald-300">Loyal price: ৳ {product.discountedPrice.toLocaleString()} (100+ points)</p>
          )}
          <p className="text-sm text-(--muted)">Stock: {product.stock}</p>
        </div>

        <AddToCartInline productId={product.id} stock={product.stock} />

        <div className="pt-2">
          <Link href="/" className="text-sm text-(--muted) underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

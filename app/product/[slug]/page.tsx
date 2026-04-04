/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getPublicProductBySlug(slug);
  const specificationEntries = Object.entries(product.specifications ?? {});

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <div className="relative h-72 overflow-hidden rounded-3xl border border-zinc-200 bg-white sm:h-105">
          <img
            src={product.images[0] ?? "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">{product.categoryName}</p>
        <h1 className="text-3xl font-semibold text-zinc-900">{product.name}</h1>

        {product.description ? (
          <article
            className="prose prose-zinc max-w-none text-zinc-700"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <p className="text-zinc-600">No description provided.</p>
        )}

        {specificationEntries.length > 0 && (
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-base font-semibold text-zinc-900">Specifications</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {specificationEntries.map(([key, value]) => (
                <div key={key} className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{key}</p>
                  <p className="text-sm font-medium text-zinc-800">{typeof value === "string" ? value : JSON.stringify(value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-2xl font-semibold text-zinc-900">৳ {product.price.toLocaleString()}</p>
          {product.discountedPrice !== null && (
            <p className="text-sm text-emerald-700">Loyal price: ৳ {product.discountedPrice.toLocaleString()} (100+ points)</p>
          )}
          <p className="text-sm text-zinc-600">Stock: {product.stock}</p>
        </div>

        <AddToCartInline productId={product.id} stock={product.stock} />

        <div className="pt-2">
          <Link href="/" className="text-sm text-zinc-600 underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}

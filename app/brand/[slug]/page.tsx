import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getPublicBrandBySlug } from "@/lib/server/services/brand-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function BrandPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const brand = await getPublicBrandBySlug(slug);
  const result = await getPublicProducts({
    page: 1,
    pageSize: 24,
    brandSlug: slug,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Brand: {brand.name}</h1>
          <p className="text-sm text-zinc-600">{result.total} products found</p>
        </div>
        <Link href="/" className="rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
          Back Home
        </Link>
      </div>

      {result.items.length === 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
          No products available for this brand yet.
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}

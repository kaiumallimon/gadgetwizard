import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function CategoryPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const result = await getPublicProducts({
    page: 1,
    pageSize: 24,
    categorySlug: slug,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Category: {slug}</h1>
          <p className="text-sm text-[color:var(--muted)]">{result.total} products found</p>
        </div>
        <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
          Back Home
        </Link>
      </div>

      {result.items.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-[color:var(--muted)]">
          No products available in this category yet.
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

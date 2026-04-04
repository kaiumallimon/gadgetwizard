import Link from "next/link";

import { BannerShowcase } from "@/components/banner-showcase";
import { ProductCard } from "@/components/product-card";
import { getPublicBanners } from "@/lib/server/services/banner-service";
import { getPublicCategoryTree } from "@/lib/server/services/category-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, categories, featuredProducts] = await Promise.all([
    getPublicBanners(),
    getPublicCategoryTree(),
    getPublicProducts({ page: 1, pageSize: 8 }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,#1f2937,#05070f_55%)] p-8 sm:p-12">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-(--accent)/35 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <p className="text-sm uppercase tracking-[0.2em] text-(--muted)">Tech Commerce Platform</p>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Discover flagship gadgets with a smarter, reward-ready cart flow.
          </h1>
          <p className="text-base leading-relaxed text-(--muted)">
            Browse categories, compare specifications, and build your cart. Loyal users unlock discounted pricing automatically.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cart" className="rounded-full bg-(--accent) px-5 py-2 font-semibold text-black">
              Go To Cart
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/20 px-5 py-2 font-semibold text-white">
              User Dashboard
            </Link>
          </div>
        </div>
      </section>

      <BannerShowcase banners={banners} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Shop By Category</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              href={`/category/${category.slug}`}
              key={category.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-white/30"
            >
              <p className="text-lg font-medium text-white">{category.name}</p>
              <p className="text-sm text-(--muted)">{category.children.length} subcategories</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Featured Products</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

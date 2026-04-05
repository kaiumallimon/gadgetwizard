/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { BannerShowcase } from "@/components/banner-showcase";
import { ProductCard } from "@/components/product-card";
import { getPublicBanners } from "@/lib/server/services/banner-service";
import { getPublicBrands } from "@/lib/server/services/brand-service";
import { getPublicCategoryTree } from "@/lib/server/services/category-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, categories, brands, productPool] = await Promise.all([
    getPublicBanners(),
    getPublicCategoryTree(),
    getPublicBrands(),
    getPublicProducts({ page: 1, pageSize: 48 }),
  ]);

  const categoryHighlights = categories.slice(0, 12);
  const brandHighlights = brands.slice(0, 24);
  const newTrends = productPool.items.filter((item) => item.isNewArrival || item.isTrending).slice(0, 6);
  const featuredGrid = productPool.items.filter((item) => item.isFeatured || item.isBestSeller).slice(0, 8);
  const fallbackTrends = newTrends.length > 0 ? newTrends : productPool.items.slice(0, 6);
  const fallbackFeatured = featuredGrid.length > 0 ? featuredGrid : productPool.items.slice(0, 8);

  const categoryImageById = new Map<number, string>();
  for (const product of productPool.items) {
    if (!categoryImageById.has(product.categoryId) && product.images.length > 0) {
      categoryImageById.set(product.categoryId, product.images[0]);
    }
  }

  const serviceHighlights = [
    "36 Months EMI",
    "Fastest Home Delivery",
    "Exchange Facility",
    "Best Price Deals",
    "After Sales Service",
  ];

  return (
    <div className="bg-white py-6">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6">
        <BannerShowcase banners={banners} />

        <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-5">
            {serviceHighlights.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-(--accent)" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-4xl font-semibold text-zinc-900">
            Featured <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Categories</span>
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categoryHighlights.map((category) => (
              <Link
                href={`/category/${category.slug}`}
                key={category.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-20 w-full items-center justify-center bg-white p-2 sm:h-24">
                  {category.imageUrl || category.icon || categoryImageById.get(category.id) ? (
                    <img
                      src={category.imageUrl ?? category.icon ?? categoryImageById.get(category.id)}
                      alt={category.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-100 to-zinc-200 text-2xl font-semibold text-zinc-600">
                      {category.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 p-2 sm:p-3">
                  <p className="line-clamp-1 text-xs font-semibold text-zinc-900 group-hover:text-(--accent) sm:text-sm">
                    {category.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 sm:text-xs">{category.children.length} subcategories</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-4xl font-semibold text-zinc-900">
            Shop By <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Brands</span>
          </h2>

          {brandHighlights.length === 0 ? (
            <p className="text-sm text-zinc-500">No brands available yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {brandHighlights.map((brand) => (
                <Link
                  href={`/brand/${brand.slug}`}
                  key={brand.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-20 items-center justify-center bg-zinc-50 p-3 sm:h-24">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-linear-to-br from-zinc-100 to-zinc-200 text-lg font-semibold text-zinc-600">
                        {brand.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center sm:p-3">
                    <p className="line-clamp-1 text-xs font-semibold text-zinc-900 group-hover:text-(--accent) sm:text-sm">{brand.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-4xl font-semibold text-zinc-900">
            New <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Trends</span>
          </h2>

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {fallbackTrends.map((product) => (
              <article
                key={product.id}
                className="min-w-55 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
              >
                <Link href={`/product/${product.slug}`}>
                  <div className="h-36 overflow-hidden rounded-xl bg-zinc-100">
                    <img
                      src={product.images[0] ?? "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>

                <div className="mt-3 space-y-1">
                  <Link href={`/product/${product.slug}`} className="line-clamp-2 font-semibold text-zinc-900 hover:text-(--accent)">
                    {product.name}
                  </Link>
                  <p className="text-xl font-semibold text-zinc-950">
                    ৳ {(product.discountedPrice !== null && product.discountedPrice < product.originalPrice
                      ? product.discountedPrice
                      : product.originalPrice).toLocaleString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-semibold text-zinc-900">
              Featured <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Products</span>
            </h2>
            <Link href="/cart" className="rounded-full bg-(--accent) px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
              Open Cart
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fallbackFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-zinc-950 px-5 py-6 text-white sm:px-7">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Member Benefits</p>
              <h3 className="mt-2 text-2xl font-semibold">Get reward-ready pricing and faster support.</h3>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="rounded-full bg-(--accent) px-5 py-2 font-semibold text-white hover:brightness-95">
                User Dashboard
              </Link>
              <Link href="/?auth=login" className="rounded-full border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 hover:border-zinc-500">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

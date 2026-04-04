/* eslint-disable @next/next/no-img-element */
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
    getPublicProducts({ page: 1, pageSize: 16 }),
  ]);

  const categoryHighlights = categories.slice(0, 12);
  const newTrends = featuredProducts.items.slice(0, 6);
  const featuredGrid = featuredProducts.items.slice(0, 8);

  const serviceHighlights = [
    "36 Months EMI",
    "Fastest Home Delivery",
    "Exchange Facility",
    "Best Price Deals",
    "After Sales Service",
  ];

  return (
    <div className="bg-zinc-100 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-7 px-4 sm:px-6">
        <BannerShowcase banners={banners} />

        <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
          <div className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-5">
            {serviceHighlights.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-4xl font-semibold text-zinc-900">
            Featured <span className="bg-linear-to-r from-orange-500 via-amber-500 to-violet-500 bg-clip-text text-transparent">Categories</span>
          </h2>

          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
            {categoryHighlights.map((category) => (
              <Link
                href={`/category/${category.slug}`}
                key={category.id}
                className="group flex flex-col items-center gap-2 rounded-2xl px-2 py-3 transition hover:bg-zinc-100"
              >
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
                  {category.icon ? (
                    <img src={category.icon} alt={category.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-lg font-semibold text-zinc-700">
                      {category.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-center text-sm font-medium text-zinc-700 group-hover:text-zinc-950">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <h2 className="text-4xl font-semibold text-zinc-900">
            New <span className="bg-linear-to-r from-orange-500 via-amber-500 to-violet-500 bg-clip-text text-transparent">Trends</span>
          </h2>

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {newTrends.map((product) => (
              <article
                key={product.id}
                className="min-w-[220px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
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
                  <Link href={`/product/${product.slug}`} className="line-clamp-2 font-semibold text-zinc-900 hover:text-orange-600">
                    {product.name}
                  </Link>
                  <p className="text-xl font-semibold text-zinc-950">৳ {product.price.toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-semibold text-zinc-900">
              Featured <span className="bg-linear-to-r from-orange-500 via-amber-500 to-violet-500 bg-clip-text text-transparent">Products</span>
            </h2>
            <Link href="/cart" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              Open Cart
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGrid.map((product) => (
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
              <Link href="/dashboard" className="rounded-full bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600">
                User Dashboard
              </Link>
              <Link href="/login" className="rounded-full border border-zinc-700 px-5 py-2 font-semibold text-zinc-200 hover:border-zinc-500">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

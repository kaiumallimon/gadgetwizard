/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, ChevronRight, Shapes } from "lucide-react";

import { getPublicBrands } from "@/lib/server/services/brand-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const [brands, productPool] = await Promise.all([
    getPublicBrands(),
    getPublicProducts({ page: 1, pageSize: 240, sort: ["newest"] }),
  ]);

  const featuredBrands = brands.filter((brand) => brand.isFeatured).slice(0, 12);

  const previewImageByBrandSlug = new Map<string, string>();
  for (const product of productPool.items) {
    if (!product.brandSlug || product.images.length === 0) {
      continue;
    }

    if (!previewImageByBrandSlug.has(product.brandSlug)) {
      previewImageByBrandSlug.set(product.brandSlug, product.images[0]);
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-50 via-white to-sky-50/40 p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-100/70 blur-2xl" aria-hidden="true" />

          <div className="relative space-y-4">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Brand Directory</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                  Shop By <span className="bg-linear-to-r from-sky-500 to-cyan-500 bg-clip-text text-transparent">Brands</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                  Explore every active brand and jump directly into each dedicated catalog.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                <Shapes className="h-3.5 w-3.5" /> {brands.length} brands
              </span>
            </div>
          </div>
        </header>

        {featuredBrands.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">Featured Brands</h2>
                <p className="mt-1 text-sm text-zinc-500">Highlighted manufacturers shoppers love right now.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {featuredBrands.length} highlighted
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredBrands.map((brand) => {
                const imageUrl = brand.imageUrl ?? previewImageByBrandSlug.get(brand.slug);

                return (
                  <Link
                    key={brand.id}
                    href={`/brand/${brand.slug}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
                  >
                    <div className="flex h-40 w-full items-center justify-center bg-linear-to-br from-zinc-50 via-white to-sky-50/40 p-4 sm:h-44">
                      {imageUrl ? (
                        <img src={imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-500">
                          {brand.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="line-clamp-1 text-sm font-semibold text-zinc-800">{brand.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition group-hover:text-sky-600">
                        Explore <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">All Brands</h2>
              <p className="mt-1 text-sm text-zinc-500">Browse the full list and open each brand page.</p>
            </div>
          </div>

          {brands.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
              No brands are available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {brands.map((brand) => {
                const imageUrl = brand.imageUrl ?? previewImageByBrandSlug.get(brand.slug);

                return (
                  <Link
                    key={brand.id}
                    href={`/brand/${brand.slug}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm"
                  >
                    <div className="flex h-24 items-center justify-center bg-white p-3 sm:h-28">
                      {imageUrl ? (
                        <img src={imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-linear-to-br from-zinc-100 to-zinc-200 text-2xl font-semibold text-zinc-600">
                          {brand.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 p-3">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{brand.name}</p>
                      <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:text-sky-600" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

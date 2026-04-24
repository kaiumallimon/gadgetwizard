/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, ChevronRight, Layers3 } from "lucide-react";

import { getPublicCategoryTree } from "@/lib/server/services/category-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

function flattenCategories(
  categories: Awaited<ReturnType<typeof getPublicCategoryTree>>,
): Awaited<ReturnType<typeof getPublicCategoryTree>> {
  const flat: Awaited<ReturnType<typeof getPublicCategoryTree>> = [];

  for (const category of categories) {
    flat.push(category);
    if (category.children.length > 0) {
      flat.push(...flattenCategories(category.children));
    }
  }

  return flat;
}

export default async function CategoriesPage() {
  const [tree, productPool] = await Promise.all([
    getPublicCategoryTree(),
    getPublicProducts({ page: 1, pageSize: 240, sort: ["newest"] }),
  ]);

  const categories = flattenCategories(tree);
  const featuredCategories = categories.filter((category) => category.isFeatured).slice(0, 12);
  const headerCategories = categories.filter((category) => category.isHeaderCategory).slice(0, 8);

  const previewImageByCategorySlug = new Map<string, string>();
  for (const product of productPool.items) {
    if (!previewImageByCategorySlug.has(product.categorySlug) && product.images.length > 0) {
      previewImageByCategorySlug.set(product.categorySlug, product.images[0]);
    }
  }

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-50 via-white to-orange-50/40 p-6 sm:p-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-100/70 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-amber-100/60 blur-2xl" aria-hidden="true" />

          <div className="relative space-y-4">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
              <ArrowLeft className="h-4 w-4" /> Back Home
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Store Directory</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                  Explore All <span className="bg-linear-to-r from-accent to-orange-500 bg-clip-text text-transparent">Categories</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                  Browse everything in one place and jump directly into curated product collections.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700">
                <Layers3 className="h-3.5 w-3.5" /> {categories.length} categories
              </span>
            </div>
          </div>
        </header>

        {headerCategories.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Quick Picks</h2>
                <p className="text-sm text-zinc-500">Your top navigation categories, all in one strip.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {headerCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-zinc-900"
                >
                  {category.name}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {featuredCategories.length > 0 && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">Featured Categories</h2>
                <p className="mt-1 text-sm text-zinc-500">Popular collections picked by the store team.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {featuredCategories.length} highlighted
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCategories.map((category) => {
                const imageUrl = category.imageUrl ?? category.icon ?? previewImageByCategorySlug.get(category.slug);

                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm"
                  >
                    <div className="aspect-16/8 w-full bg-linear-to-br from-zinc-50 to-zinc-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={category.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-500">
                          {category.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <p className="line-clamp-1 text-sm font-semibold text-zinc-800">{category.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition group-hover:text-accent">
                        Shop now <ChevronRight className="h-3.5 w-3.5" />
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
              <h2 className="text-2xl font-semibold text-zinc-900">All Categories</h2>
              <p className="mt-1 text-sm text-zinc-500">Everything available in GadgetWizard, sorted by store priority.</p>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
              No categories are available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((category) => {
                const imageUrl = category.imageUrl ?? category.icon ?? previewImageByCategorySlug.get(category.slug);

                return (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm"
                  >
                    <div className="flex h-24 items-center justify-center bg-zinc-50 p-3 sm:h-28">
                      {imageUrl ? (
                        <img src={imageUrl} alt={category.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-linear-to-br from-zinc-100 to-zinc-200 text-2xl font-semibold text-zinc-600">
                          {category.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 p-3">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{category.name}</p>
                      <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:text-accent" />
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
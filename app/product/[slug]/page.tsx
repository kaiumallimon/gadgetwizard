/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, CircleCheck, ShieldCheck, Truck } from "lucide-react";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { Badge } from "@/components/ui/badge";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSpecificationSections(specifications: Record<string, unknown> | null) {
  if (!specifications) {
    return [] as Array<{ title: string; rows: Array<{ key: string; value: string }> }>;
  }

  const entries = Object.entries(specifications);
  if (entries.length === 0) {
    return [] as Array<{ title: string; rows: Array<{ key: string; value: string }> }>;
  }

  const allNestedObjects = entries.every(([, value]) => isPlainObject(value));

  if (allNestedObjects) {
    return entries
      .map(([title, value]) => {
        const rows = Object.entries(value as Record<string, unknown>).map(([key, rowValue]) => ({
          key,
          value: typeof rowValue === "string" ? rowValue : JSON.stringify(rowValue),
        }));

        return {
          title,
          rows,
        };
      })
      .filter((section) => section.rows.length > 0);
  }

  return [
    {
      title: "General",
      rows: entries.map(([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      })),
    },
  ];
}

export default async function ProductDetailsPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getPublicProductBySlug(slug);
  const specificationSections = normalizeSpecificationSections(product.specifications);
  const fallbackImage = "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200";
  const galleryImages = product.images.length > 0 ? product.images : [fallbackImage];
  const hasLoyalPrice = product.discountedPrice !== null;
  const savingsAmount = hasLoyalPrice ? product.price - (product.discountedPrice ?? 0) : 0;
  const savingsPercent = hasLoyalPrice && product.price > 0
    ? Math.max(0, Math.round((savingsAmount / product.price) * 100))
    : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`} className="hover:text-zinc-900">{product.categoryName}</Link>
          <span>/</span>
          <span className="line-clamp-1 text-zinc-900">{product.name}</span>
        </div>
        <Link href={`/category/${product.categorySlug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-br from-zinc-100 via-white to-zinc-100 p-4 shadow-sm">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-white">
              <img
                src={galleryImages[0]}
                alt={product.name}
                className="h-full w-full object-contain p-2"
              />
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.slice(0, 4).map((image, index) => (
                <article
                  key={`${image}-${index}`}
                  className={`overflow-hidden rounded-xl border bg-white p-2 ${index === 0 ? "border-(--accent) ring-2 ring-(--accent)/20" : "border-zinc-200"}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-50">
                    <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-contain" />
                  </div>
                </article>
              ))}
            </div>
          )}

          {product.description ? (
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Description</p>
              <div
                className="prose prose-zinc mt-3 max-w-none text-zinc-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </article>
          ) : (
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-600 shadow-sm">
              No description provided.
            </article>
          )}

          {specificationSections.length > 0 && (
            <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900">Specifications</h2>
              <div className="space-y-4">
                {specificationSections.map((section) => (
                  <section key={section.title} className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">{section.title}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {section.rows.map((row) => (
                        <div
                          key={`${section.title}-${row.key}`}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2"
                        >
                          <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{row.key}</p>
                          <p className="text-sm font-medium text-zinc-800">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="uppercase tracking-[0.16em]">{product.categoryName}</Badge>
            <Badge variant={product.stock > 0 ? "secondary" : "outline"} className={product.stock > 0 ? "bg-emerald-100 text-emerald-700" : ""}>
              {product.stock > 0 ? "In Stock" : "Out Of Stock"}
            </Badge>
          </div>

          <h1 className="text-3xl font-semibold leading-tight text-zinc-900">{product.name}</h1>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold text-zinc-900">৳ {product.price.toLocaleString()}</p>
              {hasLoyalPrice && (
                <p className="text-sm font-medium text-zinc-500 line-through">৳ {product.discountedPrice?.toLocaleString()}</p>
              )}
            </div>

            {hasLoyalPrice && (
              <p className="mt-1 text-sm font-medium text-emerald-700">
                Loyalty price saves ৳ {savingsAmount.toLocaleString()} ({savingsPercent}%)
              </p>
            )}

            <p className="mt-2 text-sm text-zinc-600">Stock available: {product.stock}</p>
          </div>

          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">Purchase Options</p>
            <AddToCartInline productId={product.id} stock={product.stock} />
          </div>

          <div className="space-y-2 rounded-2xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-white p-4">
            <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <Truck className="h-4 w-4 text-(--accent)" /> Fast nationwide delivery
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <ShieldCheck className="h-4 w-4 text-(--accent)" /> Official warranty support
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <CircleCheck className="h-4 w-4 text-(--accent)" /> Secure checkout-ready cart flow
            </p>
          </div>

          <div className="pt-1">
            <Link href="/" className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>

    </div>
  );
}

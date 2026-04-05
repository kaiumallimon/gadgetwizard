import Link from "next/link";
import { ArrowLeft, CircleCheck, ShieldCheck, Truck } from "lucide-react";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { ProductGallery } from "@/components/product-gallery";
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
  const hasDiscount = product.discountedPrice !== null && product.discountedPrice < product.originalPrice;
  const hasLoyalPrice = product.loyalCustomerPrice < product.originalPrice;
  const discountedPrice = hasDiscount ? (product.discountedPrice ?? product.originalPrice) : product.originalPrice;
  const savingsAmount = hasDiscount ? product.originalPrice - discountedPrice : 0;
  const savingsPercent = hasDiscount && product.originalPrice > 0
    ? Math.max(0, Math.round((savingsAmount / product.originalPrice) * 100))
    : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3 bg-zinc-50/50 backdrop-blur-md px-4 py-3 -mx-4 sm:mx-0 sm:rounded-2xl sm:border sm:border-zinc-200">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
          <span>/</span>
          <Link href={`/category/${product.categorySlug}`} className="transition-colors hover:text-zinc-900">{product.categoryName}</Link>
          <span>/</span>
          <span className="line-clamp-1 font-medium text-zinc-900">{product.name}</span>
        </div>
        <Link href={`/category/${product.categorySlug}`} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] pt-4">
        <section className="space-y-4">
          <ProductGallery images={galleryImages} productName={product.name} />

          {product.description ? (
            <article className="pt-8">
              <h2 className="text-xl font-medium tracking-tight text-zinc-900 mb-6 border-b border-zinc-100 pb-2">Overview</h2>
              <div
                className="prose prose-zinc mt-4 max-w-none text-[15px] leading-relaxed text-zinc-600 prose-headings:font-medium prose-a:text-blue-600 hover:prose-a:text-blue-500"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </article>
          ) : (
            <article className="pt-8 text-zinc-500 italic">
              No detailed overview provided.
            </article>
          )}

          {specificationSections.length > 0 && (
            <section className="pt-10">
              <h2 className="text-xl font-medium tracking-tight text-zinc-900 mb-6 border-b border-zinc-100 pb-2">Tech Specs</h2>
              <div className="space-y-8">
                {specificationSections.map((section) => (
                  <section key={section.title} className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{section.title}</h3>
                    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {section.rows.map((row) => (
                        <div
                          key={`${section.title}-${row.key}`}
                          className="flex flex-col border-b border-zinc-100 pb-3"
                        >
                          <span className="text-sm text-zinc-500">{row.key}</span>
                          <span className="text-sm font-medium text-zinc-900 mt-1">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:h-fit">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full bg-zinc-50 text-xs font-medium text-zinc-600 border-zinc-200 px-3 py-1">{product.categoryName}</Badge>
              {product.brandName && <Badge variant="outline" className="rounded-full bg-zinc-50 text-xs font-medium text-zinc-600 border-zinc-200 px-3 py-1">{product.brandName}</Badge>}
              <Badge variant="secondary" className={`rounded-full px-3 py-1 text-xs font-medium ${product.stock > 0 ? "bg-green-100 text-green-700 hover:bg-green-200/80" : "bg-red-100 text-red-700 hover:bg-red-200/80"}`}>
                {product.stock > 0 ? "In Stock" : "Out Of Stock"}
              </Badge>
              {product.isNewArrival && <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-medium">New Arrival</Badge>}
              {product.isBestSeller && <Badge variant="secondary" className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">Best Seller</Badge>}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">{product.name}</h1>
            {product.shortDescription && <p className="text-lg text-zinc-500 leading-relaxed">{product.shortDescription}</p>}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-medium tracking-tight text-zinc-900">৳ {discountedPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <span className="text-lg text-zinc-400 line-through">৳ {product.originalPrice.toLocaleString()}</span>
                )}
              </div>

              {hasDiscount && (
                <span className="text-sm font-medium text-green-600">
                  Save ৳ {savingsAmount.toLocaleString()} ({savingsPercent}%)
                </span>
              )}

              {hasLoyalPrice && (
                <span className="text-sm font-medium text-blue-600 mt-1">
                  Loyalty Price: ৳ {product.loyalCustomerPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="pt-2">
              <AddToCartInline productId={product.id} stock={product.stock} />
            </div>

            <div className="grid gap-3 p-5 mt-6 border-t border-zinc-100">
              {product.isFreeDelivery && (
                <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <Truck className="h-4 w-4 text-zinc-900" /> Free nationwide delivery
                </p>
              )}
              {(product.isOfficialWarranty || (product.warrantyMonths ?? 0) > 0) && (
                <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
                  <ShieldCheck className="h-4 w-4 text-zinc-900" />
                  {product.warrantyMonths ? `${product.warrantyMonths}-month official warranty` : "Official warranty support"}
                </p>
              )}
              <p className="inline-flex items-center gap-2 text-sm text-zinc-600">
                <CircleCheck className="h-4 w-4 text-zinc-900" /> Secure checkout-ready cart flow
              </p>
              {product.isCashOnDelivery && <p className="text-sm text-zinc-600">Cash on Delivery available</p>}
              {product.isEmiAvailable && <p className="text-sm text-zinc-600">EMI options available</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

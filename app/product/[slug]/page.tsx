import Link from "next/link";
import { ArrowLeft, CircleCheck, ShieldCheck, Truck } from "lucide-react";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { ProductReviewsSection } from "@/components/product-reviews-section";
import { ProductGallery } from "@/components/product-gallery";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/server/auth/server-session";
import { getCurrentUser } from "@/lib/server/services/auth-service";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";
import { getApprovedProductReviews } from "@/lib/server/services/review-service";

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

function parseColorOptions(colorValue: string | null): string[] {
  if (!colorValue) {
    return [];
  }

  const seen = new Set<string>();

  return colorValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) {
        return false;
      }

      const normalized = entry.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

export default async function ProductDetailsPage(context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const session = await getServerSession();
  const viewer = session?.role === "user" ? await getCurrentUser(session.userId).catch(() => null) : null;
  const product = await getPublicProductBySlug(slug);
  const approvedReviews = await getApprovedProductReviews(product.id);
  const specificationSections = normalizeSpecificationSections(product.specifications);
  const colorOptions = parseColorOptions(product.color);
  const fallbackImage = "https://blocks.astratic.com/img/general-img-square.png";
  const galleryImages = product.images.length > 0 ? product.images : [fallbackImage];
  const hasDiscount = product.discountedPrice !== null && product.discountedPrice < product.originalPrice;
  const canViewWholesale = Boolean(viewer?.isBusinessApproved);
  const hasWholesalePrice =
    canViewWholesale &&
    product.wholesalePrice !== null &&
    product.wholesaleMinQuantity !== null &&
    product.wholesalePrice < product.originalPrice;
  const discountedPrice = hasDiscount ? (product.discountedPrice ?? product.originalPrice) : product.originalPrice;
  const savingsAmount = hasDiscount ? product.originalPrice - discountedPrice : 0;
  const savingsPercent = hasDiscount && product.originalPrice > 0
    ? Math.max(0, Math.round((savingsAmount / product.originalPrice) * 100))
    : 0;
  const approvedReviewCount = approvedReviews.length;
  const approvedReviewAverage = approvedReviewCount > 0
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviewCount
    : 0;

  return (
    <div className="w-full px-5 pb-16 pt-6 sm:px-6 lg:px-10 xl:px-14">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="transition-colors hover:text-zinc-900">Home</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`} className="transition-colors hover:text-zinc-900">{product.categoryName}</Link>
            <span>/</span>
            <span className="line-clamp-1 font-medium text-zinc-900">{product.name}</span>
          </nav>

          <Link
            href={`/category/${product.categorySlug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start xl:gap-16">
          <section className="order-1 xl:col-start-1">
            <ProductGallery images={galleryImages} productName={product.name} />
          </section>

          <aside className="order-2 space-y-8 xl:col-start-2">
            <section className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">{product.categoryName}</Badge>
                {product.brandName && (
                  <Badge variant="outline" className="rounded-full border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">{product.brandName}</Badge>
                )}
                <Badge
                  variant="secondary"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${product.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                >
                  {product.stock > 0 ? "In Stock" : "Out Of Stock"}
                </Badge>
                {product.isNewArrival && <Badge variant="secondary" className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">New Arrival</Badge>}
                {product.isBestSeller && <Badge variant="secondary" className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Best Seller</Badge>}
              </div>

              <div className="space-y-4">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-3xl">{product.name}</h1>
                {product.shortDescription && <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">{product.shortDescription}</p>}
                {approvedReviewCount > 0 && (
                  <p className="text-sm font-medium text-zinc-700">
                    {approvedReviewAverage.toFixed(1)} / 5 from {approvedReviewCount} review{approvedReviewCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {(product.modelNumber || product.sku) && (
                <dl className="flex max-w-2xl flex-col gap-2">
                  {product.modelNumber && (
                    <div className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <dt className="pt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Model</dt>
                      <dd className="text-sm font-medium text-zinc-900 break-all">{product.modelNumber}</dd>
                    </div>
                  )}
                  {product.sku && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <dt className="pt-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">SKU</dt>
                      <dd className="text-xs font-medium text-zinc-900 break-all">{product.sku}</dd>
                    </div>
                  )}
                </dl>
              )}
            </section>

            <section className="space-y-6 border-y border-zinc-200/80 py-7">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold tracking-tight text-zinc-900">AU${discountedPrice.toLocaleString()}</span>
                  {hasDiscount && (
                    <span className="text-lg text-zinc-400 line-through">AU${product.originalPrice.toLocaleString()}</span>
                  )}
                </div>

                {hasDiscount && (
                  <span className="text-sm font-medium text-green-600">
                    Save AU${savingsAmount.toLocaleString()} ({savingsPercent}%)
                  </span>
                )}

                {hasWholesalePrice && (
                  <span className="mt-1 text-sm font-medium text-blue-600">
                    Business Wholesale: AU${product.wholesalePrice?.toLocaleString()} from {product.wholesaleMinQuantity}+ units
                  </span>
                )}
              </div>

              <AddToCartInline productId={product.id} stock={product.stock} colorOptions={colorOptions} />
            </section>

            <section className="space-y-5">
              <div className="grid gap-3">
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

              {product.highlightPoints.length > 0 && (
                <div className="space-y-3 border-t border-zinc-100 pt-5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Why this product</h2>
                  <ul className="space-y-2">
                    {product.highlightPoints.map((point, index) => (
                      <li key={`${point}-${index}`} className="flex items-start gap-2 text-sm text-zinc-600">
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </aside>

          {specificationSections.length > 0 && (
            <section className="order-3 space-y-8 border-t border-zinc-100 pt-10 xl:col-span-2">
              <h2 className="inline-flex w-fit items-center border-l-4 border-zinc-900 bg-zinc-100 px-3 py-1 text-xl font-semibold tracking-tight text-zinc-900">Specs</h2>
              <div className="space-y-8">
                {specificationSections.map((section) => (
                  <section key={section.title} className="space-y-4">
                    <h3 className="font-bold uppercase text-zinc-800">{section.title}</h3>
                    <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                      {section.rows.map((row) => (
                        <div
                          key={`${section.title}-${row.key}`}
                          className="border-b border-zinc-100 pb-3"
                        >
                          <p className="text-sm text-zinc-500">{row.key}</p>
                          <p className="mt-1 text-sm font-medium text-zinc-900">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          )}

          {product.description ? (
            <article className="order-4 space-y-4 border-t border-zinc-100 pt-10 xl:col-span-2">
              <h2 className="text-xl font-medium tracking-tight text-zinc-900">Description</h2>
              <div
                className="tiptap-content text-[15px] text-zinc-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </article>
          ) : (
            <article className="order-4 border-t border-zinc-100 pt-10 text-zinc-500 italic xl:col-span-2">
              No detailed description provided.
            </article>
          )}

          {approvedReviewCount > 0 && <ProductReviewsSection initialReviews={approvedReviews} />}
        </div>
      </div>
    </div>
  );
}

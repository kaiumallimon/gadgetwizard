import Link from "next/link";
import { notFound as nextNotFound } from "next/navigation";
import { ArrowLeft, CircleCheck, ShieldCheck, Truck } from "lucide-react";

import { AddToCartInline } from "@/components/add-to-cart-inline";
import { ProductGallery } from "@/components/product-gallery";
import { Badge } from "@/components/ui/badge";
import { HttpError } from "@/lib/server/core/errors";
import { getPublicProductBySlug } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSpecificationSections(specifications: Record<string, unknown> | null) {
  if (!specifications) return [];

  const entries = Object.entries(specifications);
  if (entries.length === 0) return [];

  const allNestedObjects = entries.every(([, value]) => isPlainObject(value));

  if (allNestedObjects) {
    return entries
      .map(([title, value]) => ({
        title,
        rows: Object.entries(value as Record<string, unknown>).map(([key, rowValue]) => ({
          key,
          value: typeof rowValue === "string" ? rowValue : JSON.stringify(rowValue),
        })),
      }))
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

export default async function ProductDetailsPage({ params }: { params: { slug: string } }) {
  let product;

  try {
    product = await getPublicProductBySlug(params.slug);
  } catch (error) {
    if (error instanceof HttpError && error.code === "NOT_FOUND") {
      nextNotFound();
    }

    throw error;
  }

  const specificationSections = normalizeSpecificationSections(product.specifications);

  const fallbackImage = "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=1200";
  const galleryImages = product.images.length > 0 ? product.images : [fallbackImage];

  const discountedPrice = product.discountedPrice ?? product.originalPrice;
  const hasDiscount = discountedPrice < product.originalPrice;
  const savings = hasDiscount ? product.originalPrice - discountedPrice : 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center text-sm text-gray-500">
          <div className="flex gap-2 items-center">
            <Link href="/" className="hover:text-black">Home</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`} className="hover:text-black">
              {product.categoryName}
            </Link>
            <span>/</span>
            <span className="text-black font-medium line-clamp-1">{product.name}</span>
          </div>

          <Link
            href={`/category/${product.categorySlug}`}
            className="flex items-center gap-1 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-12">
        {/* LEFT */}
        <div className="space-y-10">
          <ProductGallery images={galleryImages} productName={product.name} />

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Product Overview</h2>
            {product.description ? (
              <div
                className="prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-gray-400 italic">No description available</p>
            )}
          </div>

          {/* Specs */}
          {specificationSections.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Specifications</h2>
              <div className="space-y-8">
                {specificationSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                      {section.title}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {section.rows.map((row) => (
                        <div
                          key={row.key}
                          className="border rounded-xl p-4 bg-gray-50"
                        >
                          <p className="text-xs text-gray-500">{row.key}</p>
                          <p className="font-medium text-gray-900 mt-1">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="lg:sticky top-20 h-fit space-y-6">
          {/* Card */}
          <div className="border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge>{product.categoryName}</Badge>
              {product.brandName && <Badge variant="outline">{product.brandName}</Badge>}
              <Badge
                variant={product.stock > 0 ? "default" : "outline"}
                className={product.stock > 0 ? undefined : "border-red-200 bg-red-50 text-red-700"}
              >
                {product.stock > 0 ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-semibold">{product.name}</h1>

            {/* Price */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-black">
                  AUD {discountedPrice.toLocaleString()}
                </span>

                {hasDiscount && (
                  <span className="line-through text-gray-400">
                    AUD {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <p className="text-green-600 text-sm mt-1">
                  Save AUD {savings.toLocaleString()}
                </p>
              )}
            </div>

            {/* CTA */}
            <AddToCartInline productId={product.id} stock={product.stock} />

            {/* Features */}
            <div className="border-t pt-4 space-y-3 text-sm text-gray-600">
              {product.isFreeDelivery && (
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Free delivery
                </p>
              )}

              {(product.isOfficialWarranty || (product.warrantyMonths ?? 0) > 0) && (
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {product.warrantyMonths
                    ? `${product.warrantyMonths} months warranty`
                    : "Official warranty"}
                </p>
              )}

              <p className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4" /> Secure checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
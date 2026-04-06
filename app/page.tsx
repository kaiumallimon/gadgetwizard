/* eslint-disable @next/next/no-img-element */
import { BadgePercent, CreditCard, Headset, RefreshCcw, Truck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { BannerShowcase } from "@/components/banner-showcase";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/client/types";
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

  const featuredCategoryHighlights = categories.filter((category) => category.isFeatured).slice(0, 12);
  const brandHighlights = brands.slice(0, 24);
  const newTrends = productPool.items.filter((item) => item.isNewArrival || item.isTrending).slice(0, 6);
  const featuredGrid = productPool.items.filter((item) => item.isFeatured || item.isBestSeller).slice(0, 8);
  const fallbackTrends = newTrends.length > 0 ? newTrends : productPool.items.slice(0, 6);
  const fallbackFeatured = featuredGrid.length > 0 ? featuredGrid : productPool.items.slice(0, 8);
  const bestSellerProducts = productPool.items.filter((item) => item.isBestSeller).slice(0, 8);
  const topRatedProducts = productPool.items.filter((item) => item.isTopRated).slice(0, 8);
  const newArrivalProducts = productPool.items.filter((item) => item.isNewArrival).slice(0, 8);
  const freeDeliveryProducts = productPool.items.filter((item) => item.isFreeDelivery).slice(0, 8);
  const limitedStockProducts = productPool.items.filter((item) => item.isLimitedStock).slice(0, 8);

  const curatedProductSections: Array<{
    key: string;
    titleLead: string;
    titleAccent: string;
    subtitle: string;
    items: Product[];
  }> = [
    {
      key: "best-sellers",
      titleLead: "Best",
      titleAccent: "Sellers",
      subtitle: "Most purchased products customers are choosing this week.",
      items: bestSellerProducts,
    },
    {
      key: "top-rated",
      titleLead: "Top",
      titleAccent: "Rated",
      subtitle: "Highly rated picks trusted by verified shoppers.",
      items: topRatedProducts,
    },
    {
      key: "new-arrivals",
      titleLead: "New",
      titleAccent: "Arrivals",
      subtitle: "Freshly listed items just added to the storefront.",
      items: newArrivalProducts,
    },
    {
      key: "free-delivery",
      titleLead: "Free",
      titleAccent: "Delivery",
      subtitle: "Save more with products eligible for free delivery.",
      items: freeDeliveryProducts,
    },
    {
      key: "limited-stock",
      titleLead: "Limited",
      titleAccent: "Stock",
      subtitle: "Low-inventory products that may sell out soon.",
      items: limitedStockProducts,
    },
  ];
  const visibleCuratedProductSections = curatedProductSections.filter((section) => section.items.length > 0);

  const categoryImageById = new Map<number, string>();
  for (const product of productPool.items) {
    if (!categoryImageById.has(product.categoryId) && product.images.length > 0) {
      categoryImageById.set(product.categoryId, product.images[0]);
    }
  }

  const serviceHighlights: Array<{ title: string; note: string; icon: LucideIcon }> = [
    { title: "36 Months EMI", note: "Flexible monthly plans", icon: CreditCard },
    { title: "Fastest Home Delivery", note: "Express dispatch nationwide", icon: Truck },
    { title: "Exchange Facility", note: "Upgrade with trade-in", icon: RefreshCcw },
    { title: "Best Price Deals", note: "Daily promo pricing", icon: BadgePercent },
    { title: "After Sales Service", note: "Dedicated support team", icon: Headset },
  ];

  const storefrontInfoBlocks: Array<{ title: string; body: string }> = [
    {
      title: "Australia's Trusted Tech E-Commerce Store for Phones, Gadgets & Accessories",
      body: "In Australia, Gadget Wizard has emerged as the premier source for genuine gadgets and accessories. We provide you with reliable brands all in one place, from the newest iPhones and iPads to robust MacBooks and wearables. Essentials like docks, hubs, safety gear, and stylus pens are also available. We always strive to provide you with excellent service, prompt delivery, and authentic products, whether you shop online or in-store. Our collection fits every lifestyle, whether you're a student, tech enthusiast, or regular user. Additionally, our customer care representatives are available at all times to help you with warranty inquiries, product selections, and post-purchase assistance.",
    },
    {
      title: "Smartphones & Tablets from Apple, Samsung, Xiaomi, OnePlus & More",
      body: "Smartwatches are more than just timekeepers now; they're your health tracker, workout buddy, and personal assistant. At Gadget Wizard, we offer a wide range of options like Apple Watch, Huawei Watch, Xiaomi bands, and other popular picks that blend design with daily usefulness. Check messages, track your steps, monitor heart rate, or just match your outfit. We bring you original wearables that work smoothly and last long, backed with proper support and quick delivery.",
    },
    {
      title: "Mobile Accessories You Can Rely On - Cables, Cases, Power Banks",
      body: "The right accessories make your tech life easier. At Gadget Wizard, we offer a complete range of reliable accessories like fast-charging cables, durable power banks, magnetic wireless chargers, docks, and more. We also have high-quality phone covers and screen protectors to keep your device safe. Need a stylus or an adapter for your MacBook? You'll find that too. Our accessories are selected for both quality and compatibility, so they work exactly how you need them to. Whether you're replacing an old charger or buying your first wireless power bank, we've got the right tool for the job.",
    },
    {
      title: "AirPods, Wireless Earbuds & Premium Audio Devices",
      body: "Music should sound rich, clear, and uninterrupted. That's what we aim for with our collection of audio gear. From original Apple AirPods to noise-cancelling earbuds, studio-quality over-ear headphones, and pocket-size Bluetooth speakers, we've got something for every listener. When you're tuning in during a commute or zoning out at home, our devices bring sound to life. All products are tested, original, and tuned for everyday listening.",
    },
  ];

  return (
    <div className="bg-white py-6">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6">
        <BannerShowcase banners={banners} />

        <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-white via-zinc-50 to-orange-50/40 p-3">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Storefront Highlights</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Why Customers Shop Here</h2>
              <p className="mt-1 text-sm text-zinc-500">Interactive perks built for smoother checkout and better after-sales support.</p>
            </div>
          </div>
            <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-5">
              {serviceHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group flex flex-col gap-3 items-center justify-center relative overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-sm"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-(--accent) ring-1 ring-orange-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-zinc-800">{item.title}</span>
                      <span className="block truncate text-xs text-zinc-500">{item.note}</span>
                    </span>
                  </div>
                );
              })}
            </div>
        </section>

        <section className="rounded-2xl bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl font-semibold text-zinc-900">
                Featured <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Categories</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">Jump into curated collections by tapping a category tile.</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {featuredCategoryHighlights.length} highlighted
            </span>
          </div>

          {featuredCategoryHighlights.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No featured categories available right now.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {featuredCategoryHighlights.map((category) => (
                <Link
                  href={`/category/${category.slug}`}
                  key={category.id}
                  className="group overflow-hidden bg-white transition hover:-translate-y-0.5 "
                >
                  <div className="flex h-10 w-full items-center justify-center bg-white p-2 md:h-12 lg:h-14">
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
                    <p className="line-clamp-1 text-xs text-center text-zinc-500 group-hover:text-(--accent)">
                      {category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-4xl font-semibold text-zinc-900">
                Shop By <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Brands</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">Discover product lines by your favorite brands in one tap.</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {brandHighlights.length} featured
            </span>
          </div>

          {brandHighlights.length === 0 ? (
            <p className="text-sm text-zinc-500">No brands available yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {brandHighlights.map((brand) => (
                <Link
                  href={`/brand/${brand.slug}`}
                  key={brand.id}
                  className="group overflow-hidden bg-white transition hover:-translate-y-0.5 "
                >
                  <div className="flex h-10 w-full items-center justify-center bg-white p-2 md:h-12 lg:h-14">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-zinc-100 to-zinc-200 text-2xl font-semibold text-zinc-600">
                        {brand.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 p-2 sm:p-3">
                    <p className="line-clamp-1 text-center text-xs text-zinc-500 group-hover:text-(--accent) sm:text-sm">{brand.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {fallbackTrends.length > 0 && (
          <section className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-4xl font-semibold text-zinc-900">
                  New <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Trends</span>
                </h2>
                <p className="mt-2 text-sm text-zinc-500">Swipe to explore the latest arrivals and trending picks.</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">{fallbackTrends.length} products</span>
            </div>

            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {fallbackTrends.map((product) => (
                <div key={product.id} className="w-65 min-w-65">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {fallbackFeatured.length > 0 && (
          <section className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-semibold text-zinc-900">
                  Featured <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">Products</span>
                </h2>
                <p className="mt-2 text-sm text-zinc-500">Handpicked products with strong value and customer demand.</p>
              </div>
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
        )}

        {visibleCuratedProductSections.map((section) => (
          <section key={section.key} className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-4xl font-semibold text-zinc-900">
                  {section.titleLead}{" "}
                  <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">
                    {section.titleAccent}
                  </span>
                </h2>
                <p className="mt-2 text-sm text-zinc-500">{section.subtitle}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {section.items.length} products
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.items.map((product) => (
                <ProductCard key={`${section.key}-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        ))}

        <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 text-white sm:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">About Gadget Wizard</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Built For Australia's
              <span className="bg-linear-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent"> Modern Tech Lifestyle</span>
            </h2>
            <p className="max-w-3xl text-sm text-zinc-300 sm:text-base">
              Everything you need in one trusted store - from flagship devices to everyday accessories and post-purchase support.
            </p>
          </div>

          <div className="relative mt-6 grid gap-4 md:grid-cols-2">
            {storefrontInfoBlocks.map((block, index) => (
              <article
                key={block.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-white/10"
              >
                <div className="mb-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/10 px-2 text-xs font-semibold text-orange-200">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold leading-snug text-white">{block.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{block.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 sm:p-7">
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

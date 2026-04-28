/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { Headset, ShieldCheck, Truck, Warehouse, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { BannerShowcase } from "@/components/banner-showcase";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { ProductScrollRow } from "@/components/storefront/product-scroll-row";
import { StorefrontHomeSkeleton } from "@/components/storefront/storefront-skeletons";
import type { Product } from "@/lib/client/types";
import { getPublicBanners } from "@/lib/server/services/banner-service";
import { getPublicBrands } from "@/lib/server/services/brand-service";
import { getPublicProducts } from "@/lib/server/services/product-service";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<StorefrontHomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const [banners, brands, productPool] = await Promise.all([
    getPublicBanners(),
    getPublicBrands(),
    getPublicProducts({ page: 1, pageSize: 48 }),
  ]);

  const brandHighlights = brands.filter((brand) => brand.isFeatured).slice(0, 24);
  const marqueeBrands = brandHighlights;
  const featuredProducts = productPool.items.filter((item) => item.isFeatured).slice(0, 8);
  const newArrivalProducts = productPool.items.filter((item) => item.isNewArrival).slice(0, 8);
  const trendingProducts = productPool.items.filter((item) => item.isTrending).slice(0, 6);
  const bestSellerProducts = productPool.items.filter((item) => item.isBestSeller).slice(0, 8);
  const topRatedProducts = productPool.items.filter((item) => item.isTopRated).slice(0, 8);
  const freeDeliveryProducts = productPool.items.filter((item) => item.isFreeDelivery).slice(0, 8);
  const officialWarrantyProducts = productPool.items.filter((item) => item.isOfficialWarranty).slice(0, 8);
  const uniformProductCardWidthClass = "w-[calc(100vw-4.5rem)] min-w-[calc(100vw-4.5rem)] md:w-65 md:min-w-65";

  const homepageProductSections: Array<{
    key: string;
    titleLead: string;
    titleAccent?: string;
    subtitle: string;
    items: Product[];
  }> = [
    {
      key: "featured",
      titleLead: "Featured",
      subtitle: "Handpicked products with strong value and customer demand.",
      items: featuredProducts,
    },
    {
      key: "new-arrivals",
      titleLead: "New",
      titleAccent: "Arrivals",
      subtitle: "Freshly listed items just added to the storefront.",
      items: newArrivalProducts,
    },
    {
      key: "trending",
      titleLead: "Trending",
      subtitle: "Top trends shoppers are viewing right now.",
      items: trendingProducts,
    },
    {
      key: "top-rated",
      titleLead: "Top",
      titleAccent: "Rated",
      subtitle: "Highly rated picks trusted by verified shoppers.",
      items: topRatedProducts,
    },
    {
      key: "best-seller",
      titleLead: "Best",
      titleAccent: "Seller",
      subtitle: "Most purchased products customers are choosing this week.",
      items: bestSellerProducts,
    },
    {
      key: "free-delivery",
      titleLead: "Free",
      titleAccent: "Delivery",
      subtitle: "Save more with products eligible for free delivery.",
      items: freeDeliveryProducts,
    },
    {
      key: "official-warranty",
      titleLead: "Official",
      titleAccent: "Warranty",
      subtitle: "Products backed by official warranty coverage.",
      items: officialWarrantyProducts,
    },
  ];
  const visibleHomepageProductSections = homepageProductSections.filter((section) => section.items.length > 0);

  const serviceHighlights: Array<{ title: string; note: string; icon: LucideIcon }> = [
    { title: "Free Shipping", note: "Free Shipping on all orders over $100", icon: Truck },
    { title: "24/7 Self Pickup", note: "Flexible time to pickup in office", icon: Warehouse },
    { title: "Online Support", note: "Talk with us via live chat", icon: Headset },
    { title: "Secure Payment", note: "Shop with confidence", icon: ShieldCheck },
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
      title: "AirPods, Wireless Earbuds & Premium $io Devices",
      body: "Music should sound rich, clear, and uninterrupted. That's what we aim for with our collection of $io gear. From original Apple AirPods to noise-cancelling earbuds, studio-quality over-ear headphones, and pocket-size Bluetooth speakers, we've got something for every listener. When you're tuning in during a commute or zoning out at home, our devices bring sound to life. All products are tested, original, and tuned for everyday listening.",
    },
  ];

  return (
    <div className="bg-white py-6">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6">
        <BannerShowcase banners={banners} />

        <section className="hidden md:block relative overflow-hidden rounded-2xl bg-linear-to-br from-white via-zinc-50 to-orange-50/40 p-3">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Storefront Highlights</p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">Why Customers Shop Here</h2>
              <p className="mt-1 text-sm text-zinc-500">Interactive perks built for smoother checkout and better after-sales support.</p>
            </div>
          </div>
            <div className="grid gap-2 text-sm text-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="group/brand-marquee relative mt-6 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white to-transparent" />

              <div className="flex w-max animate-[brand-marquee_42s_linear_infinite] will-change-transform group-hover/brand-marquee:paused">
                {[0, 1].map((copyIndex) => {
                  const isClone = copyIndex === 1;

                  return (
                    <div key={`brand-copy-${copyIndex}`} aria-hidden={isClone || undefined} className="flex shrink-0 gap-3 pr-3">
                      {marqueeBrands.map((brand, index) => (
                        <Link
                          href={`/brand/${brand.slug}`}
                          key={`${copyIndex}-${brand.id}-${index}`}
                          tabIndex={isClone ? -1 : undefined}
                          className="group/brand relative flex h-20 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-orange-200"
                        >
                          {brand.imageUrl ? (
                            <img src={brand.imageUrl} alt={brand.name} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full w-full rounded-md items-center justify-center bg-linear-to-br from-zinc-100 to-zinc-200 text-2xl font-semibold text-zinc-600">
                              {brand.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {visibleHomepageProductSections.map((section) => (
          <section key={section.key} className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-4xl font-semibold text-zinc-900">
                  {section.titleAccent ? (
                    <>
                      {section.titleLead}{" "}
                      <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">
                        {section.titleAccent}
                      </span>
                    </>
                  ) : (
                    <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent">
                      {section.titleLead}
                    </span>
                  )}
                </h2>
                <p className="mt-2 text-sm text-zinc-500">{section.subtitle}</p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {section.items.length} products
              </span>
            </div>

            <ProductScrollRow items={section.items} cardWidthClass={uniformProductCardWidthClass} />
          </section>
        ))}

        <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-orange-50/60 via-white to-amber-50/40 p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />

          <div className="relative space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">About Gadget Wizard</p>
            <h2 className="text-3xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
              Built For Australia's
              <span className="bg-linear-to-r from-(--accent) via-orange-400 to-amber-400 bg-clip-text text-transparent"> Modern Tech Lifestyle</span>
            </h2>
            <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
              Everything you need in one trusted store - from flagship devices to everyday accessories and post-purchase support.
            </p>
          </div>

          <div className="relative mt-8 grid gap-x-8 gap-y-8 md:grid-cols-2">
            {storefrontInfoBlocks.map((block, index) => (
              <article key={block.title} className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-(--accent) shadow-sm ring-1 ring-orange-100">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold leading-snug text-zinc-900">{block.title}</h3>
                </div>
                <p className="pl-11 text-sm leading-relaxed text-zinc-600">{block.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* <section className="rounded-2xl bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-zinc-950 px-5 py-6 text-white sm:px-7">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Member Benefits</p>
              <h3 className="mt-2 text-2xl font-semibold">Get volume-ready pricing and faster support.</h3>
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
        </section> */}
      </div>

      <LiveChatWidget sourceType="home" />
    </div>
  );
}

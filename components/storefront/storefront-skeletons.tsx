const baseBlockClass = "animate-pulse rounded-xl bg-zinc-200/70";
const basePillClass = "animate-pulse rounded-full bg-zinc-200/70";
const skeletonCardWidthClass = "w-[calc(100vw-4.5rem)] min-w-[calc(100vw-4.5rem)] md:w-65 md:min-w-65";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`${baseBlockClass} ${className}`.trim()} />;
}

function SkeletonPill({ className = "" }: { className?: string }) {
  return <div className={`${basePillClass} ${className}`.trim()} />;
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 space-y-3">
      <SkeletonBlock className="h-36 w-full rounded-xl" />
      <SkeletonBlock className="h-4 w-4/5" />
      <SkeletonBlock className="h-3 w-2/5" />
      <div className="flex items-center justify-between">
        <SkeletonPill className="h-6 w-20" />
        <SkeletonPill className="h-8 w-24" />
      </div>
    </div>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-2">
        <SkeletonBlock className="h-6 w-44" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      <SkeletonPill className="h-7 w-24" />
    </div>
  );
}

function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(16.25rem,16.25rem))] justify-start gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={`product-skeleton-${index}`} />
      ))}
    </div>
  );
}

function ListingMarqueeSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="relative overflow-hidden">
      <div className="flex gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={`product-marquee-skeleton-${index}`} className={skeletonCardWidthClass}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StorefrontHomeSkeleton() {
  return (
    <div className="bg-white py-6">
      <div className="mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6">
        <SkeletonBlock className="h-44 rounded-2xl sm:h-60" />

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 space-y-4">
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={`brand-skeleton-${index}`}
                className="rounded-xl border border-zinc-200 bg-white p-3"
              >
                <SkeletonBlock className="h-10 w-full rounded-lg" />
                <SkeletonBlock className="mt-3 h-3 w-3/5" />
              </div>
            ))}
          </div>
        </section>

        {Array.from({ length: 2 }).map((_, index) => (
          <section key={`section-skeleton-${index}`} className="space-y-4 rounded-2xl bg-white p-5 sm:p-7">
            <SectionHeaderSkeleton />
            <ListingMarqueeSkeleton count={8} />
          </section>
        ))}
      </div>
    </div>
  );
}

export function FilterableListingSkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-3">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-72" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={`filter-line-${index}`} className="h-3 w-full" />
            ))}
            <SkeletonBlock className="h-9 w-full rounded-lg" />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonPill className="h-7 w-24" />
            </div>
            <ListingGridSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="w-full px-5 pb-16 pt-6 sm:px-6 lg:px-10 xl:px-14">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start xl:gap-16">
          <SkeletonBlock className="aspect-square rounded-3xl" />

          <div className="space-y-6">
            <div className="space-y-3">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="h-9 w-4/5" />
              <SkeletonBlock className="h-4 w-3/5" />
            </div>

            <div className="space-y-3">
              <SkeletonBlock className="h-10 w-40" />
              <SkeletonBlock className="h-4 w-28" />
            </div>

            <div className="space-y-4">
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <SkeletonBlock className="h-10 rounded-lg" />
                <SkeletonBlock className="h-10 rounded-lg" />
              </div>
            </div>

            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-40" />
              <SkeletonBlock className="h-4 w-52" />
              <SkeletonBlock className="h-4 w-44" />
            </div>
          </div>
        </div>

        <section className="space-y-4 border-t border-zinc-100 pt-8">
          <SkeletonBlock className="h-6 w-28" />
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`spec-skeleton-${index}`} className="space-y-2">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-4 w-40" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 space-y-3">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="h-4 w-80" />
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4">
          <SkeletonBlock className="h-6 w-36" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={`directory-card-${index}`} className="rounded-xl border border-zinc-200 bg-white p-3">
                <SkeletonBlock className="h-16 w-full rounded-lg" />
                <SkeletonBlock className="mt-3 h-3 w-3/5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`cart-item-${index}`} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4">
            <SkeletonBlock className="h-20 w-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
            <SkeletonBlock className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
          <SkeletonBlock className="h-5 w-36" />
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={`checkout-field-${index}`} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function WishlistSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-4 w-56" />
      </header>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <SkeletonBlock className="h-10 w-full lg:max-w-md rounded-lg" />
          <SkeletonBlock className="h-10 w-40 rounded-lg" />
          <SkeletonBlock className="h-10 w-32 rounded-lg" />
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={`wishlist-card-${index}`} />
        ))}
      </section>
    </div>
  );
}

export function InfoPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-4 w-80" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={`info-line-${index}`} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

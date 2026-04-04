/* eslint-disable @next/next/no-img-element */
import type { Banner } from "@/lib/client/types";

interface BannerShowcaseProps {
  banners: Banner[];
}

export function BannerShowcase({ banners }: BannerShowcaseProps) {
  if (banners.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-(--muted)">
        No live campaign banners yet.
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {banners.slice(0, 3).map((banner) => {
        const card = (
          <article className="group overflow-hidden rounded-3xl border border-white/10 bg-black/20">
            <div className="relative h-40 w-full sm:h-56">
              <img
                src={banner.desktopImageUrl}
                alt={banner.title}
                className="hidden h-full w-full object-cover transition duration-500 group-hover:scale-105 sm:block"
              />
              <img
                src={banner.mobileImageUrl}
                alt={banner.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105 sm:hidden"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 sm:p-6">
                <h3 className="text-xl font-semibold text-white">{banner.title}</h3>
              </div>
            </div>
          </article>
        );

        if (banner.clickUrl) {
          return (
            <a href={banner.clickUrl} target="_blank" rel="noreferrer" key={banner.id}>
              {card}
            </a>
          );
        }

        return <div key={banner.id}>{card}</div>;
      })}
    </section>
  );
}

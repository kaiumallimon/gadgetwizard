"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { Banner } from "@/lib/client/types";

interface BannerShowcaseProps {
  banners: Banner[];
}

export function BannerShowcase({ banners }: BannerShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = useMemo(() => banners, [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [activeBanners.length]);

  if (banners.length === 0) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-500">
        No live campaign banners yet.
      </section>
    );
  }

  const active = activeBanners[currentIndex];

  function previousSlide() {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  }

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }

  const slideBody = (
    <article className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative h-52 w-full md:h-90">
        <Image
          src={active.desktopImageUrl}
          alt={active.title}
          fill
          priority
          sizes="(min-width: 1200px) 100vw, 50vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 text-white md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/75">Featured Campaign</p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold md:text-4xl">{active.title}</h2>
        </div>

        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={previousSlide}
              className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/85 text-xl text-zinc-900 hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={nextSlide}
              className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/85 text-xl text-zinc-900 hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {activeBanners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">
          {activeBanners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Go to banner ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all ${index === currentIndex ? "w-6 bg-(--accent)" : "w-2.5 bg-white/75"}`}
            />
          ))}
        </div>
      )}
    </article>
  );

  if (active.clickUrl) {
    return (
      <a href={active.clickUrl} target="_blank" rel="noreferrer" className="block">
        {slideBody}
      </a>
    );
  }

  return slideBody;
}

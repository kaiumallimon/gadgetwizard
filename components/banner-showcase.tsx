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

  function isLocalImage(url: string) {
    return url.startsWith("http://localhost:") || url.startsWith("http://127.0.0.1:");
  }

  function previousSlide() {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  }

  function nextSlide() {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }

  const slideBody = (
    <article className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[2.2/1] w-full sm:aspect-[2.8/1] lg:aspect-3/1">
        <div
          className="flex h-full will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {activeBanners.map((banner, index) => {
            const slideLayer = (
              <>
                <Image
                  src={banner.desktopImageUrl}
                  alt={banner.title}
                  fill
                  priority={index === currentIndex}
                  unoptimized={isLocalImage(banner.desktopImageUrl)}
                  sizes="(min-width: 1280px) 1120px, 100vw"
                  className="object-cover object-center transition duration-700 group-hover:scale-105"
                />
                
              </>
            );

            return (
              <div key={banner.id} className="relative h-full w-full shrink-0 grow-0 basis-full">
                {banner.clickUrl ? (
                  <a href={banner.clickUrl} target="_blank" rel="noreferrer" className="relative block h-full">
                    {slideLayer}
                  </a>
                ) : (
                  <div className="relative h-full">{slideLayer}</div>
                )}
              </div>
            );
          })}
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

  return slideBody;
}

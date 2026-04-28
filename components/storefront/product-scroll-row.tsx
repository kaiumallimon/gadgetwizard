"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Product } from "@/lib/client/types";
import { ProductCard } from "@/components/product-card";

interface ProductScrollRowProps {
  items: Product[];
  cardWidthClass?: string;
}

export function ProductScrollRow({
  items,
  cardWidthClass = "w-[calc(100vw-4.5rem)] min-w-[calc(100vw-4.5rem)] md:w-65 md:min-w-65",
}: ProductScrollRowProps) {
  if (items.length === 0) {
    return null;
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const maxScrollLeft = element.scrollWidth - element.clientWidth;
    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    updateScrollState();

    const handleScroll = () => updateScrollState();
    element.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    if (resizeObserver) {
      resizeObserver.observe(element);
    }

    window.addEventListener("resize", updateScrollState);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const amount = Math.max(260, Math.floor(element.clientWidth * 0.8));
    const delta = direction === "left" ? -amount : amount;
    element.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const showControls = canScrollLeft || canScrollRight;

  return (
    <div className="group/rail relative">

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          aria-label="Scroll left"
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-zinc-700 shadow-lg backdrop-blur transition hover:text-zinc-900 hover:shadow-xl opacity-100 md:h-10 md:w-10 md:opacity-0 md:group-hover/rail:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          aria-label="Scroll right"
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-zinc-700 shadow-lg backdrop-blur transition hover:text-zinc-900 hover:shadow-xl opacity-100 md:h-10 md:w-10 md:opacity-0 md:group-hover/rail:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <div ref={scrollRef} className="gw-hide-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scroll-smooth">
        {items.map((product) => (
          <div key={product.id} className={cardWidthClass}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

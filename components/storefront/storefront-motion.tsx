"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface StorefrontMotionProps {
  children: React.ReactNode;
}

export function StorefrontMotion({ children }: StorefrontMotionProps) {
  const pathname = usePathname();
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(scope, { clearProps: "all" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        scope,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
      );
    }, scope);

    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={scopeRef} className="min-h-full">
      {children}
    </div>
  );
}

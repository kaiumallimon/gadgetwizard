"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [zoomStyle, setZoomStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();

    let x = (e.clientX - left) / width;
    let y = (e.clientY - top) / height;

    // 🔒 Clamp values to avoid showing edges
    const clamp = (val: number, min: number, max: number) =>
      Math.min(Math.max(val, min), max);

    x = clamp(x, 0.15, 0.85);
    y = clamp(y, 0.15, 0.85);

    setZoomStyle({
      transform: "scale(2)",
      transformOrigin: `${x * 100}% ${y * 100}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-4xl flex items-center justify-center">
        <div
          className="relative aspect-square w-full max-w-lg overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={selectedImage}
            alt={productName}
            style={zoomStyle}
            className="w-full h-full object-contain transition-transform duration-200 ease-out hover:cursor-zoom-in"
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap justify-center gap-4">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-50 p-2 transition-all w-20 h-20 sm:w-24 sm:h-24 hover:ring-2 hover:ring-zinc-300 focus:outline-none flex items-center justify-center",
                selectedImage === image
                  ? "ring-2 ring-zinc-900 shadow-sm"
                  : "ring-1 ring-zinc-200"
              )}
            >
              <img
                src={image}
                alt={`${productName} view ${index + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
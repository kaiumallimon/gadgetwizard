/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] bg-zinc-50 flex items-center justify-center p-8 sm:p-12">
        <div className="relative aspect-square w-full max-w-lg flex items-center justify-center">
          <img
            src={selectedImage}
            alt={productName}
            className="max-h-full max-w-full object-contain pointer-events-none transition-all duration-300"
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
                "relative overflow-hidden rounded-2xl bg-zinc-50 p-2 transition-all w-20 h-20 sm:w-24 sm:h-24 hover:ring-2 hover:ring-zinc-300 focus:outline-none flex items-center justify-center",
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
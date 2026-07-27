"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductGroup } from "@/types";
import ProductCard from "@/components/product/ProductCard";

interface FeaturedProductCarouselProps {
  groups: ProductGroup[];
}

export default function FeaturedProductCarousel({
  groups,
}: FeaturedProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateNavigation = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const animationFrame = window.requestAnimationFrame(updateNavigation);
    emblaApi.on("select", updateNavigation);
    emblaApi.on("reInit", updateNavigation);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      emblaApi.off("select", updateNavigation);
      emblaApi.off("reInit", updateNavigation);
    };
  }, [emblaApi, updateNavigation]);

  if (groups.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-1.5 flex touch-pan-y md:-ml-6">
          {groups.slice(0, 5).map((group) => (
            <div
              key={group.id}
              className="min-w-0 flex-[0_0_50%] pl-1.5 sm:flex-[0_0_33.333%] md:flex-[0_0_25%] md:pl-6"
            >
              <ProductCard group={group} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        aria-label="Geser featured product ke kiri"
        className="absolute left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/85 text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-primary/60 hover:text-primary disabled:pointer-events-none disabled:opacity-30 md:h-9 md:w-9"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
      </button>

      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Geser featured product ke kanan"
        className="absolute right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/85 text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-primary/60 hover:text-primary disabled:pointer-events-none disabled:opacity-30 md:h-9 md:w-9"
      >
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </button>
    </div>
  );
}

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
        className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-0 md:flex"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        aria-label="Geser featured product ke kanan"
        className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-md transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-0 md:flex"
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}

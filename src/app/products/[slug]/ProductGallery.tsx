"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ProductGalleryProps {
  images: string[];
  activeImage?: string;
  onActiveImageChange?: (image: string) => void;
}

export default function ProductGallery({ images, activeImage: controlledImage, onActiveImageChange }: ProductGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [internalIndex, setInternalIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const displayedImage = controlledImage || images[internalIndex];

  // Sync embla with controlledImage
  useEffect(() => {
    if (controlledImage && emblaApi) {
      const idx = images.indexOf(controlledImage);
      if (idx !== -1 && idx !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(idx);
      }
      setFadeKey(k => k + 1);
    }
  }, [controlledImage, emblaApi, images]);

  // Sync internal state with embla swipe
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setInternalIndex(idx);
    if (onActiveImageChange && images[idx]) {
      onActiveImageChange(images[idx]);
    }
  }, [emblaApi, onActiveImageChange, images]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleThumbnailClick = (idx: number) => {
    if (emblaApi) emblaApi.scrollTo(idx);
    setInternalIndex(idx);
    if (onActiveImageChange) {
      onActiveImageChange(images[idx]);
    }
  };

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="flex flex-col gap-0 md:gap-2">
      {/* Main Image */}
      <div className="relative aspect-square w-full md:rounded-lg overflow-hidden bg-white border-b border-gray-100 md:border md:bg-gray-50 md:border-gray-200 group">
        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex w-full h-full">
            {images.map((img, idx) => (
              <div key={idx} className="relative flex-[0_0_100%] min-w-0 h-full">
                <Image 
                  src={img}
                  alt={`Product Image ${idx + 1}`}
                  fill
                  className="object-contain"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={scrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={scrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div 
          className="flex gap-2 overflow-x-auto p-3 md:px-0 md:py-0" 
          style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
          {images.map((img, idx) => {
            const isSelected = controlledImage ? img === controlledImage : idx === internalIndex;
            return (
              <button 
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`relative w-14 h-14 md:w-16 md:h-16 rounded overflow-hidden border-2 shrink-0 ${isSelected ? 'border-[#0021F3]' : 'border-gray-200 hover:border-gray-300'} transition-all`}
              >
                <Image 
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
                {isSelected && (
                  <div className="absolute bottom-0 right-0 bg-[#0021F3] text-white rounded-tl">
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

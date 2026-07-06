"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  activeImage?: string;
  onActiveImageChange?: (image: string) => void;
}

export default function ProductGallery({ images, activeImage: controlledImage, onActiveImageChange }: ProductGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const displayedImage = controlledImage || images[internalIndex];

  // Trigger fade on controlled image change
  useEffect(() => {
    if (controlledImage) {
      setFadeKey(k => k + 1);
    }
  }, [controlledImage]);

  // Reset internal index when gallery changes
  useEffect(() => {
    setInternalIndex(0);
  }, [images]);

  const handleThumbnailClick = (idx: number) => {
    setInternalIndex(idx);
    if (onActiveImageChange) {
      onActiveImageChange(images[idx]);
    }
  };

  return (
    <div className="flex flex-col gap-0 md:gap-2">
      {/* Main Image */}
      <div className="relative aspect-square w-full md:rounded-lg overflow-hidden bg-white border-b border-gray-100 md:border md:bg-gray-50 md:border-gray-200">
        <Image 
          key={`img-${fadeKey}-${displayedImage}`}
          src={displayedImage}
          alt="Product Image"
          fill
          className="object-contain animate-in fade-in duration-300"
          priority
        />
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

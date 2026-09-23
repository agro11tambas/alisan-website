"use client";

import { useState, useCallback, useMemo } from "react";
import { ProductGroup } from "@/types";
import ProductGallery, { GALLERY_IMAGE_SIZES } from "./ProductGallery";
import ProductActions from "./ProductActions";
import { useGalleryPreload } from "./useGalleryPreload";

type ProductCombination = { image?: string };


export default function ProductDetailClient({ group }: { group: ProductGroup }) {
  const defaultImage = group.image || group.gallery?.[0] || "/image/Placeholder.jpg";
  const defaultGallery = group.gallery?.length ? group.gallery : [defaultImage];

  const [activeImage, setActiveImage] = useState<string>(defaultImage);
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGallery);

  // Tiap foto yang bisa muncul akibat pilihan user, dikumpulkan sekali supaya
  // bisa dihangatkan sebelum diklik. Gambar kombinasi didahulukan karena itu
  // yang paling sering belum pernah dibuat turunannya oleh optimizer.
  const selectableImages = useMemo(() => {
    const combinations = (group as ProductGroup & { _combinations?: ProductCombination[] })._combinations || [];
    const collected = [
      ...combinations.map((combination) => combination.image),
      ...group.products.flatMap((product) => [product.image, ...(product.gallery || [])]),
      group.image,
      ...(group.gallery || []),
    ];
    return Array.from(new Set(collected.filter((image): image is string => Boolean(image))));
  }, [group]);

  useGalleryPreload(selectableImages, GALLERY_IMAGE_SIZES);

  const handleImageChange = useCallback((image: string, gallery?: string[]) => {
    const nextGallery = (gallery || []).filter(Boolean);

    // Combination images from ERP are not necessarily part of the product's
    // regular gallery. Include the selected image so the desktop carousel can
    // actually render and scroll to it.
    if (!nextGallery.includes(image)) {
      nextGallery.unshift(image);
    }

    setActiveImage(image);
    setGalleryImages(nextGallery.length > 0 ? nextGallery : [image]);
  }, []);

  return (
    <div className="flex flex-col md:grid md:grid-cols-2 gap-1.5 md:gap-8 bg-gray-100 md:bg-transparent">
      {/* Gallery - full width on mobile */}
      <div className="w-full bg-white md:bg-transparent">
        <ProductGallery
          images={galleryImages}
          activeImage={activeImage}
          onActiveImageChange={setActiveImage}
        />
      </div>

      {/* Main Info Column */}
      <div className="w-full flex flex-col gap-1.5 md:gap-0 md:block bg-transparent">
        
        {/* Top Info Block (Title, Rating) - will merge visually with Price in ProductActions */}
        <div className="w-full bg-white px-3 pt-3 md:px-0 md:pt-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 tracking-tight leading-tight">
            {group.name}
          </h1>


        </div>

        <ProductActions group={group} onImageChange={handleImageChange} />
      </div>
    </div>
  );
}

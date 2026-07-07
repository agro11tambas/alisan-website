"use client";

import { useState, useCallback } from "react";
import { ProductGroup } from "@/types";
import ProductGallery from "./ProductGallery";
import ProductActions from "./ProductActions";


export default function ProductDetailClient({ group }: { group: ProductGroup }) {
  const defaultImage = group.image || group.gallery?.[0] || "/image/Placeholder.jpg";
  const defaultGallery = group.gallery?.length ? group.gallery : [defaultImage];

  const [activeImage, setActiveImage] = useState<string>(defaultImage);
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGallery);

  const handleImageChange = useCallback((image: string, gallery?: string[]) => {
    setActiveImage(image);
    if (gallery && gallery.length > 0) {
      setGalleryImages(gallery);
    } else {
      setGalleryImages([image]);
    }
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

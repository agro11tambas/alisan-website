"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ProductImagePreviewProps {
  image: string;
  alt: string;
  onClose: () => void;
}

export default function ProductImagePreview({
  image,
  alt,
  onClose,
}: ProductImagePreviewProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview gambar ${alt}`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        autoFocus
        onClick={onClose}
        aria-label="Tutup preview gambar"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition-transform active:scale-95"
      >
        <X size={22} />
      </button>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={image}
          alt={alt}
          className="max-h-[85vh] max-w-full object-contain"
        />
      </div>
    </div>,
    document.body
  );
}

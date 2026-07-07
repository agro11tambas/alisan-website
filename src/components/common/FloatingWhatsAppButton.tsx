"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { informationService } from "@/services/informationService";

let cachedPhoneNumber: string | null = null;

export default function FloatingWhatsAppButton({ initialPhoneNumber = "6281234567890" }: { initialPhoneNumber?: string }) {
  const pathname = usePathname();
  const [adminNumber, setAdminNumber] = useState<string>(cachedPhoneNumber || initialPhoneNumber);

  useEffect(() => {
    if (!cachedPhoneNumber) {
      informationService.getInformation().then(info => {
        if (info && info.phone_number) {
          let num = info.phone_number.replace(/\D/g, '');
          if (num.startsWith('0')) {
            num = '62' + num.substring(1);
          }
          cachedPhoneNumber = num;
          setAdminNumber(num);
        }
      });
    }
  }, []);

  // Define routes that have a bottom floating action bar on mobile
  // Product pages have format /products/slug, but not /products itself
  const hasBottomBar =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    (pathname?.startsWith("/products/") && pathname !== "/products");

  const whatsappUrl = `https://wa.me/${adminNumber}`;

  return (
    <div
      className={`fixed right-4 md:right-6 z-[90] transition-all duration-300 pointer-events-none ${
        hasBottomBar
          ? "bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-6"
          : "bottom-6 md:bottom-6"
      }`}
    >
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat via WhatsApp"
        className="flex items-center justify-center w-[40px] h-[40px] md:w-[44px] md:h-[44px] bg-[#25D366] text-white rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 pointer-events-auto"
      >
        {/* We use a standard MessageCircle icon from lucide as closest approximation to WhatsApp if real icon unavailable */}
        <MessageCircle size={22} className="md:w-[24px] md:h-[24px]" />
      </Link>
    </div>
  );
}

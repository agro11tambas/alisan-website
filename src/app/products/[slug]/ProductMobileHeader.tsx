"use client";

import { ArrowLeft, Search, Share2, ShoppingCart, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function ProductMobileHeader() {
  const router = useRouter();
  const cartCount = useCartStore((state) => state.getTotalCount());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <style jsx global>{`
        @media (max-width: 767px) {
          header {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm h-12 flex items-center justify-between px-2 border-b border-gray-100 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
        
        <div className="flex items-center gap-0.5">
          <button className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Search size={20} />
          </button>
          
          <button className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Share2 size={20} />
          </button>
          
          <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingCart size={20} />
            {isMounted && cartCount > 0 && (
              <Badge className="absolute top-0 right-0 px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-white text-[9px] border border-white">
                {cartCount}
              </Badge>
            )}
          </Link>
          
          <button className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { ArrowLeft, Search, Share2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getInternalBackDestination } from "@/lib/navigationHistory";

export default function ProductMobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.items.length);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleBack = () => {
    const destination = getInternalBackDestination(pathname);
    router.push(destination);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        });
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Tautan disalin ke papan klip");
      } catch {
        toast.error("Gagal menyalin tautan");
      }
    }
  };

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(animationFrame);
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
      
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm h-14 flex items-center justify-between px-2 gap-2 border-b border-gray-100 shadow-sm">
        <button 
          onClick={handleBack}
          aria-label="Kembali ke halaman sebelumnya"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </button>
        
        <form onSubmit={handleSearch} className="flex-1 relative">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </button>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari..." 
            className="w-full h-9 pl-9 pr-4 text-sm bg-gray-100 border-none outline-none focus:ring-1 focus:ring-primary/20 rounded-full"
          />
        </form>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 size={20} />
          </button>
          
          <Link href="/cart" className="relative w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingCart size={20} />
            {isMounted && cartCount > 0 && (
              <Badge className="absolute top-1 right-1 px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-white text-[9px] border border-white">
                {cartCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}

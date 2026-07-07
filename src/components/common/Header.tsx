"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, Search, X, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import SearchBar from "./SearchBar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import MobileNav from "./MobileNav";

export default function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const cartCount = useCartStore((state) => state.items.length);
  const { customer, isLoggedIn } = useCurrentCustomer();

  useEffect(() => {
    setIsMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      // Focus after a short delay to allow transition to start
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="w-full bg-white border-b border-border sticky top-0 z-50 shadow-sm">

      {/* Main Header */}
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 py-1.5 md:py-2">
        <div className="flex items-center justify-between gap-1.5 md:gap-8 relative">
          
          {/* Mobile Search Overlay - Animated */}
          <div 
            className={`fixed inset-x-0 top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-transform duration-300 ease-in-out md:hidden ${
              isSearchOpen ? "translate-y-0 pointer-events-auto" : "-translate-y-full pointer-events-none"
            }`}
          >
            <div className="h-[52px] px-3 py-2 flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 shrink-0"
                aria-label="Close search"
              >
                <ArrowLeft size={20} />
              </button>
              
              <form onSubmit={handleMobileSearch} className="flex-1 relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk sablon..."
                  className="w-full h-9 bg-gray-100 rounded-full pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-9 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
                <button 
                  type="submit"
                  className="absolute right-1 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Logo & Mobile Menu */}
          <div className="flex items-center shrink-0">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger 
                className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 mr-0.5 text-gray-600 hover:text-primary rounded-md" 
                aria-label="Open menu"
              >
                <Menu size={18} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] max-w-[400px] rounded-r-2xl border-none z-[100] [&>button]:hidden">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <MobileNav onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <Link href="/" className="hidden md:flex items-center">
              <Image 
                src="/image/1751788462_LOGO-ALISAN_cropped.png" 
                alt="Alisan Logo" 
                width={150} 
                height={50} 
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg justify-center">
            <div className="w-full relative">
              <SearchBar />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 md:gap-2">
            
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden flex items-center justify-center w-8 h-8 text-gray-600 hover:text-primary transition-colors"
            >
              <Search size={18} />
            </button>

            <Link
              href="/cart"
              className="relative text-gray-600 hover:text-primary transition-colors flex items-center justify-center w-8 h-8 md:w-9 md:h-9"
            >
              <ShoppingCart size={18} className="md:w-5 md:h-5" />
              {isMounted && cartCount > 0 && (
                <Badge className="absolute top-0 right-0 px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-white text-[9px] border-2 border-white">
                  {cartCount}
                </Badge>
              )}
            </Link>



            <div className="flex items-center ml-1">
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  {customer?.name.charAt(0).toUpperCase()}
                </Link>
              ) : (
                <div className="flex items-center">
                  <Link
                    href="/login"
                    className="hidden md:flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors min-h-[44px]"
                  >
                    <User size={20} />
                    <span>Masuk</span>
                  </Link>
                  <Link
                    href="/login"
                    className="md:hidden flex items-center justify-center px-2 h-7 bg-primary text-white text-[11px] font-bold rounded shadow-sm ml-1.5"
                  >
                    Masuk
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

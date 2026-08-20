"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, Menu, Settings, LogOut, ClipboardList, MapPin } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import SearchBar from "./SearchBar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MobileNav from "./MobileNav";
import { api } from "@/services/api";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import { clearCustomerSession } from "@/lib/customer-session";

export default function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  const cartCount = useCartStore((state) => state.items.length);
  const { customer, isLoggedIn } = useCurrentCustomer();

  useEffect(() => {
    const mountedTimer = window.setTimeout(() => setIsMounted(true), 0);

    return () => window.clearTimeout(mountedTimer);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/ecommerce/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearCustomerSession();
      notifyCustomerAuthChanged();
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="w-full bg-white border-b border-border sticky top-0 z-50 shadow-sm">

      {/* Main Header */}
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 py-1.5 md:py-2">
        <div className="flex items-center justify-between gap-1.5 md:gap-8 relative">
          
          {/* Logo & Mobile Menu */}
          <div className="flex items-center shrink-0">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger 
                className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 mr-1 text-gray-600 hover:text-primary rounded-md" 
                aria-label="Open menu"
              >
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[85vw] max-w-[400px] rounded-r-2xl border-none z-[100] [&>button]:hidden">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
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
          <div className="flex-1 flex max-w-lg justify-center px-1">
            <div className="w-full relative">
              <SearchBar />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 md:gap-2">

            <Link
              href="/cart"
              className="relative text-gray-600 hover:text-primary transition-colors flex items-center justify-center w-8 h-8 md:w-9 md:h-9"
            >
              <ShoppingCart size={18} className="md:w-5 md:h-5" />
              {isMounted && cartCount > 0 && (
                <Badge className="absolute top-0 right-0 px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] border-2 border-white">
                  {cartCount}
                </Badge>
              )}
            </Link>



            <div className="flex items-center ml-1">
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors outline-none focus:ring-2 focus:ring-primary/20">
                    {customer?.name?.charAt(0).toUpperCase() || customer?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <div className="flex flex-col px-2 py-1.5 mb-1">
                      <span className="text-sm font-semibold truncate">{customer?.name || customer?.fullName}</span>
                      <span className="text-xs text-gray-500 truncate">{customer?.whatsapp_number || customer?.whatsappNumber}</span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/account/orders')} className="cursor-pointer">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Pesanan Saya</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/account/addresses')} className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Alamat Saya</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/account')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Pengaturan Akun</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

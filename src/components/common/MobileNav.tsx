"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Home, 
  Package, 
  LayoutGrid, 
  ShoppingCart, 
  Heart, 
  ClipboardList, 
  MapPin, 
  User, 
  Settings, 
  HelpCircle, 
  Info, 
  Phone,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types";

interface MobileNavProps {
  onClose: () => void;
}

export default function MobileNav({ onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { customer, isLoggedIn } = useCurrentCustomer();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
    const isActive = pathname === href;
    
    return (
      <Link 
        href={href} 
        onClick={onClose}
        className={`flex items-center gap-4 px-4 h-12 transition-colors ${
          isActive 
            ? "bg-primary/10 border-l-4 border-primary text-primary font-semibold" 
            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
        }`}
      >
        <Icon size={20} className={isActive ? "text-primary" : "text-gray-500"} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex flex-col mb-4">
          <NavLink href="/" icon={Home} label="Home" />
          <NavLink href="/products" icon={Package} label="Products" />
          
          {/* Categories Accordion */}
          <div>
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="w-full flex items-center justify-between px-4 h-12 text-gray-700 hover:bg-gray-50 border-l-4 border-transparent transition-colors"
            >
              <div className="flex items-center gap-4">
                <LayoutGrid size={20} className="text-gray-500" />
                <span className="font-medium">Categories</span>
              </div>
              {isCategoriesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {/* Expanded Categories */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="bg-gray-50/50 py-2 flex flex-col border-y border-gray-100">
                {categories.map(cat => (
                  <Link 
                    key={cat.id}
                    href={`/products?category=${cat.id}`}
                    onClick={onClose}
                    className="flex items-center px-4 py-2.5 pl-[52px] h-11 text-sm text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  >
                    • {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <NavLink href="/cart" icon={ShoppingCart} label="Cart" />
          
          {isLoggedIn && (
            <>
              <div className="h-px bg-gray-100 my-2 mx-4"></div>
              <NavLink href="/account/orders" icon={ClipboardList} label="My Orders" />
              <NavLink href="/account/addresses" icon={MapPin} label="My Addresses" />
              <NavLink href="/account" icon={User} label="Profile" />
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gray-100 pt-5 pb-8 px-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Support & Info</p>
          <div className="flex flex-col gap-1">
            <Link href="#" className="flex items-center gap-3 px-2 h-10 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              <Settings size={18} className="text-gray-400" /> Settings
            </Link>
            <Link href="#" className="flex items-center gap-3 px-2 h-10 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              <HelpCircle size={18} className="text-gray-400" /> Help Center
            </Link>
            <Link href="#" className="flex items-center gap-3 px-2 h-10 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              <Info size={18} className="text-gray-400" /> About Alisan
            </Link>
            <Link href="#" className="flex items-center gap-3 px-2 h-10 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
              <Phone size={18} className="text-gray-400" /> Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

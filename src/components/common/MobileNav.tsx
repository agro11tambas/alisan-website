"use client";

import Link from "next/link";
import Image from "next/image";
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
  ChevronUp,
  X
} from "lucide-react";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types";

interface MobileNavProps {
  onClose: () => void;
}

const NavLink = ({ 
  href, 
  icon: Icon, 
  label,
  onClose
}: { 
  href: string, 
  icon: any, 
  label: string,
  onClose: () => void 
}) => {
  const pathname = usePathname();
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

export default function MobileNav({ onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { customer, isLoggedIn } = useCurrentCustomer();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    categoryService.getCategoryTree().then(setCategories);
  }, []);

  const toggleCategory = (id: string) =>
    setOpenCategoryIds((ids) =>
      ids.includes(id) ? ids.filter((openId) => openId !== id) : [...ids, id],
    );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Logo */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center">
          <Image 
            src="/image/1751788462_LOGO-ALISAN_cropped.png" 
            alt="Alisan Logo" 
            width={120} 
            height={40} 
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
        <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex flex-col mb-4">
          <NavLink href="/" icon={Home} label="Beranda" onClose={onClose} />
          <NavLink href="/products" icon={Package} label="Produk" onClose={onClose} />
          
          {/* Categories Accordion */}
          <div>
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="w-full flex items-center justify-between px-4 h-12 text-gray-700 hover:bg-gray-50 border-l-4 border-transparent transition-colors"
            >
              <div className="flex items-center gap-4">
                <LayoutGrid size={20} className="text-gray-500" />
                <span className="font-medium">Kategori</span>
              </div>
              {isCategoriesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            
            {/* Expanded Categories */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCategoriesOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="bg-gray-50/50 py-2 flex flex-col border-y border-gray-100">
                {categories.map(cat => {
                  const hasChildren = cat.children.length > 0;
                  const isOpen = openCategoryIds.includes(cat.id);

                  return (
                    <div key={cat.id}>
                      <div className="flex items-center pr-2">
                        <Link
                          href={`/products?category=${cat.slug}`}
                          onClick={onClose}
                          className="flex flex-1 items-center h-11 pl-[52px] pr-2 text-sm font-medium text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          {cat.name}
                        </Link>

                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Tutup" : "Buka"} subkategori ${cat.name}`}
                            className="grid size-8 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        )}
                      </div>

                      {hasChildren && isOpen && (
                        <div className="flex flex-col border-l border-gray-200 ml-[60px] mb-1">
                          {cat.children.map(child => (
                            <Link
                              key={child.id}
                              href={`/products?category=${child.slug}`}
                              onClick={onClose}
                              className="flex items-center h-10 pl-4 pr-2 text-[13px] text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <NavLink href="/cart" icon={ShoppingCart} label="Keranjang" onClose={onClose} />
          
          {isLoggedIn && (
            <>
              <div className="h-px bg-gray-100 my-2 mx-4"></div>
              <NavLink href="/account/orders" icon={ClipboardList} label="Pesanan Saya" onClose={onClose} />
              <NavLink href="/account/addresses" icon={MapPin} label="Alamat Saya" onClose={onClose} />
              <NavLink href="/account" icon={User} label="Profil" onClose={onClose} />
            </>
          )}
        </div>

      </div>
    </div>
  );
}

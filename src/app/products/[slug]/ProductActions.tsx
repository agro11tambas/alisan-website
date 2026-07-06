"use client";

import { useState, useEffect } from "react";
import { ProductGroup, Product, AddOnProduct } from "@/types";
import { useCartStore } from "@/stores/useCartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, AlertCircle, MessageSquare, Heart, ShieldCheck } from "lucide-react";
import { productService } from "@/services/productService";

interface ProductActionsProps {
  group: ProductGroup;
  onImageChange?: (image: string, gallery?: string[]) => void;
}

export default function ProductActions({ group, onImageChange }: ProductActionsProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lids, setLids] = useState<AddOnProduct[]>([]);
  const [selectedLid, setSelectedLid] = useState<AddOnProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();

  useEffect(() => {
    if (group.category === 'c3') {
      productService.getAvailableLids().then(setLids);
    }
  }, [group]);

  const handleSelect = (p: Product) => {
    setSelectedProduct(p);
    setQuantity(p.minimumOrder || 1);
    if (onImageChange) {
      if (selectedLid) {
        onImageChange(
          selectedLid.image || p.image || group.image || "/image/Placeholder.jpg",
          selectedLid.gallery || p.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
        );
      } else {
        onImageChange(
          p.image || group.image || "/image/Placeholder.jpg",
          p.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
        );
      }
    }
  };

  const handleSelectLid = (lid: AddOnProduct | null) => {
    setSelectedLid(lid);
    if (selectedProduct) {
      const maxLidStock = lid ? lid.stock : Infinity;
      const finalMax = Math.min(selectedProduct.stock, maxLidStock);
      if (quantity > finalMax) {
        setQuantity(Math.max(selectedProduct.minimumOrder || 1, finalMax));
      }
    }
    if (onImageChange) {
      if (lid) {
        onImageChange(
          lid.image || selectedProduct?.image || group.image || "/image/Placeholder.jpg",
          lid.gallery || selectedProduct?.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
        );
      } else {
        onImageChange(
          selectedProduct?.image || group.image || "/image/Placeholder.jpg",
          selectedProduct?.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
        );
      }
    }
  };

  const orderStep = selectedProduct?.orderStep || 1;
  const minOrder = selectedProduct?.minimumOrder || 1;

  const maxStock = selectedProduct 
    ? Math.min(selectedProduct.stock, selectedLid ? selectedLid.stock : Infinity)
    : 0;

  const handleDecrease = () => {
    if (quantity > minOrder) {
      setQuantity(q => Math.max(minOrder, q - orderStep));
    }
  };

  const handleIncrease = () => {
    if (selectedProduct && (quantity + orderStep) <= maxStock) {
      setQuantity(q => q + orderStep);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    addItem(group, selectedProduct, quantity, selectedLid || undefined);
    toast.success("Added to Cart", {
      description: `${quantity}x ${selectedProduct.name}${selectedLid ? ` + ${selectedLid.name}` : ''} added.`
    });
  };

  const handleBuyNow = () => {
    if (!selectedProduct) return;
    addItem(group, selectedProduct, quantity, selectedLid || undefined);
    router.push('/checkout');
  };

  const displayPrice = selectedProduct 
    ? ((selectedProduct.salePrice || selectedProduct.price) + (selectedLid ? (selectedLid.salePrice || selectedLid.price) : 0))
    : Math.min(...group.products.map(p => p.salePrice || p.price));
    
  return (
    <div className="mt-2 pb-20 md:pb-0">
      
      {/* Price Display */}
      <div className="mb-3 px-3 md:px-0">
        <div className="flex items-end gap-1 md:gap-2">
          {!selectedProduct && <span className="text-xs text-gray-500 mb-0.5">From</span>}
          <span className="text-2xl font-bold text-primary tracking-tight">
            Rp {displayPrice.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Main Options */}
      <div className="border-t-[6px] border-gray-100 md:border-t md:border-gray-100 pt-3 md:pt-3 pb-2 px-3 md:px-0">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs md:text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">Product Option</h3>
          <span className="text-[10px] text-gray-500 md:hidden">Pilih &gt;</span>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-2 pb-1">
          {group.products.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            const isOutOfStock = p.stock === 0;
            return (
              <button
                key={p.id}
                onClick={() => !isOutOfStock && handleSelect(p)}
                disabled={isOutOfStock}
                className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isSelected 
                    ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary' 
                    : isOutOfStock
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:border-primary/50'
                }`}
              >
                {p.optionName || p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lid Options */}
      {lids.length > 0 && selectedProduct && (
        <div className="border-t-[6px] border-gray-100 md:border-t md:border-gray-100 pt-3 md:pt-3 pb-2 px-3 md:px-0">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-xs md:text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">Lid Option</h3>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-2 pb-1">
            <button
              onClick={() => handleSelectLid(null)}
              className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                selectedLid === null 
                  ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary' 
                  : 'border-gray-300 text-gray-700 hover:border-primary/50'
              }`}
            >
              No Lid
            </button>
            {lids.map((lid) => {
              const isSelected = selectedLid?.id === lid.id;
              const isOutOfStock = lid.stock === 0;
              return (
                <button
                  key={lid.id}
                  onClick={() => !isOutOfStock && handleSelectLid(lid)}
                  disabled={isOutOfStock}
                  className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary' 
                      : isOutOfStock
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-primary/50'
                  }`}
                >
                  {lid.name} (+Rp {(lid.salePrice || lid.price).toLocaleString('id-ID')})
                </button>
              );
            })}
          </div>
        </div>
      )}



      {/* Selected Summary */}
      {selectedProduct && (
        <div className="border-t-[6px] border-gray-100 md:border-none mb-1.5 md:mb-3 bg-gray-50 md:bg-gray-50 p-2 md:px-3 md:py-2 mx-3 md:mx-0 rounded border border-gray-200 md:border-gray-100 text-xs mt-3 md:mt-0">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-gray-500">Selected: </span>
              <span className="font-medium text-gray-900">{selectedProduct.name}</span>
              {lids.length > 0 && (
                <span className="text-gray-500"> · Lid: <span className="font-medium text-gray-900">{selectedLid ? selectedLid.name : "No Lid"}</span></span>
              )}
            </div>
            <span className="font-bold text-primary whitespace-nowrap">Rp {displayPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      {/* Desktop Quantity Block */}
      <div className="hidden md:block pt-3 pb-3 px-3 md:px-0 md:pt-0 md:pb-0 mb-3">
        <div className="flex items-center justify-between md:justify-start">
          <span className="text-sm font-bold text-gray-800 md:font-medium md:text-xs md:text-gray-700 md:w-20">Quantity</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button 
                onClick={handleDecrease}
                disabled={!selectedProduct || quantity <= minOrder}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <Minus size={14} />
              </button>
              <div className="w-14 h-9 flex items-center justify-center border-l border-r border-gray-300 text-sm font-medium bg-gray-50">
                {quantity}
              </div>
              <button 
                onClick={handleIncrease}
                disabled={!selectedProduct || (quantity + orderStep) > maxStock}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-xs text-gray-500 md:ml-3">
              Stock: <span className="font-medium text-gray-700">{selectedProduct ? maxStock : group.products.reduce((acc, p) => acc + p.stock, 0)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        {!selectedProduct && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-3 text-xs font-medium border border-amber-200">
            <AlertCircle size={14} />
            Please select an option first.
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={handleAddToCart}
            disabled={!selectedProduct}
            className="flex-1 h-10 flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold text-sm rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
          <button 
            onClick={handleBuyNow}
            disabled={!selectedProduct}
            className="flex-1 h-10 flex items-center justify-center bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Mobile Sticky Action Bar - Shopee style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2 py-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)]">
        <div className="grid grid-cols-3 gap-1.5 h-11">
          
          {/* Quantity */}
          <div className="flex items-center border border-gray-200 rounded overflow-hidden bg-gray-50 col-span-1">
            <button 
              onClick={handleDecrease}
              disabled={!selectedProduct || quantity <= minOrder}
              className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <Minus size={14} />
            </button>
            <div className="flex-1 h-full flex items-center justify-center border-x border-gray-200 text-xs font-bold bg-white">
              {quantity}
            </div>
            <button 
              onClick={handleIncrease}
              disabled={!selectedProduct || (quantity + orderStep) > maxStock}
              className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <Plus size={14} />
            </button>
          </div>
          
          {/* Cart Button */}
          <button 
            onClick={handleAddToCart}
            disabled={!selectedProduct}
            className="flex items-center justify-center gap-1.5 border border-primary text-primary bg-blue-50 font-medium text-[13px] rounded hover:bg-primary/10 disabled:opacity-50 col-span-1"
          >
            <ShoppingCart size={16} />
            Cart
          </button>
          
          {/* Buy Now Button */}
          <button 
            onClick={handleBuyNow}
            disabled={!selectedProduct}
            className="flex items-center justify-center bg-primary text-white font-medium text-[13px] rounded hover:bg-primary/90 disabled:opacity-50 shadow-sm col-span-1"
          >
            Buy Now
          </button>
          
        </div>
      </div>
    </div>
  );
}

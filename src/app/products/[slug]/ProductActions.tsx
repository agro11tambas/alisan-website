"use client";

import { useState, useEffect } from "react";
import { ProductGroup, Product, AddOnProduct } from "@/types";
import { useCartStore } from "@/stores/useCartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, AlertCircle, MessageSquare, Heart, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAddToCartFromSheet = () => {
    if (!selectedProduct) {
      toast.error("Silakan pilih varian terlebih dahulu");
      return;
    }
    handleAddToCart();
    setIsSheetOpen(false);
  };

  useEffect(() => {
    if ((group as any)._lids && (group as any)._lids.length > 0) {
      if (selectedProduct && (group as any)._combinations) {
        // Filter lids based on combinations mapped in the database
        const validLidIds = (group as any)._combinations
          .filter((c: any) => c.product_option_id === Number(selectedProduct.id))
          .map((c: any) => String(c.lid_option_id));
          
        const filteredLids = (group as any)._lids.filter((lid: AddOnProduct) => 
          validLidIds.includes(lid.id)
        );
        setLids(filteredLids);
        
        // Auto-deselect lid if it's no longer valid for this product
        if (selectedLid && !validLidIds.includes(selectedLid.id)) {
          setSelectedLid(null);
        }
      } else {
        // Show all lids if no product is selected yet
        setLids((group as any)._lids);
      }
    } else {
      setLids([]);
    }
  }, [group, selectedProduct]);

  const getCombinationImage = (productId: string, lidId?: string) => {
    if (!lidId) return null;
    const combo = (group as any)._combinations?.find(
      (c: any) => String(c.product_option_id) === String(productId) && String(c.lid_option_id) === String(lidId)
    );
    if (combo && combo.image) return combo.image;
    return null;
  };

  const handleSelect = (p: Product) => {
    setSelectedProduct(p);
    setQuantity(p.minimumOrder || 1);
    if (onImageChange) {
      const comboImage = selectedLid ? getCombinationImage(p.id, selectedLid.id) : null;
      onImageChange(
        comboImage || p.image || group.image || "/image/Placeholder.jpg",
        p.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
      );
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
      const comboImage = selectedProduct && lid ? getCombinationImage(selectedProduct.id, lid.id) : null;
      onImageChange(
        comboImage || selectedProduct?.image || group.image || "/image/Placeholder.jpg",
        selectedProduct?.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"]
      );
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



  const getCombinationPricing = (productId: string, lidId?: string) => {
    if (!lidId) return null;
    const combo = (group as any)._combinations?.find(
      (c: any) => String(c.product_option_id) === String(productId) && String(c.lid_option_id) === String(lidId)
    );
    if (combo && Number(combo.price) > 0) {
      return {
        price: Number(combo.price),
        salePrice: combo.salePrice ? Number(combo.salePrice) : undefined
      };
    }
    return null;
  };

  const comboPricing = selectedProduct && selectedLid ? getCombinationPricing(selectedProduct.id, selectedLid.id) : null;
  
  const displayPrice = selectedProduct 
    ? (
        comboPricing 
          ? (comboPricing.salePrice || comboPricing.price)
          : ((selectedProduct.salePrice || selectedProduct.price) + (selectedLid ? (selectedLid.salePrice || selectedLid.price) : 0))
      )
    : Math.min(...group.products.map(p => p.salePrice || p.price));

  const displayOriginalPrice = selectedProduct
    ? (
        comboPricing
          ? (comboPricing.salePrice ? comboPricing.price : undefined)
          : ((selectedProduct.salePrice || (selectedLid && selectedLid.salePrice)) 
              ? (selectedProduct.price + (selectedLid ? selectedLid.price : 0)) 
              : undefined)
      )
    : undefined;
    
  return (
    <div className="mt-2 pb-20 md:pb-0">
      
      {/* Price Display */}
      <div className="mb-3 px-3 md:px-0">
        <div className="flex items-end gap-1 md:gap-2">
          {!selectedProduct && <span className="text-xs text-gray-500 mb-0.5">From</span>}
          {displayOriginalPrice && (
            <span className="text-sm font-medium text-gray-400 line-through mb-1">
              Rp {displayOriginalPrice.toLocaleString('id-ID')}
            </span>
          )}
          <span className="text-2xl font-bold text-primary tracking-tight">
            Rp {displayPrice.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Main Options */}
      <div className="border-t-[6px] border-gray-100 md:border-t md:border-gray-100 pt-3 md:pt-3 pb-2 px-3 md:px-0">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs md:text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">{group.productGroupName || "Product Option"}</h3>
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
            <h3 className="text-xs md:text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">{group.lidGroupName || "Lid Option"}</h3>
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
              Tanpa {group.lidGroupName || "Lid"}
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
                <span className="text-gray-500"> · {group.lidGroupName || "Lid"}: <span className="font-medium text-gray-900">{selectedLid ? selectedLid.name : `Tanpa ${group.lidGroupName || "Lid"}`}</span></span>
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
              Maximum Qty: <span className="font-medium text-gray-700">{selectedProduct ? maxStock : group.products.reduce((acc, p) => acc + p.stock, 0)}</span>
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
            className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <ShoppingCart size={18} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] border-t border-gray-100 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button 
          onClick={() => setIsSheetOpen(true)}
          className="w-full h-11 flex items-center justify-center bg-primary text-primary-foreground font-bold text-[15px] rounded-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-all"
        >
          Beli Sekarang
        </button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 pt-3 h-[85vh] flex flex-col md:hidden z-[100] border-none">
          <SheetHeader className="px-4 pb-3 text-left border-b border-gray-100 shrink-0 relative">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative -mt-6 bg-white p-1 shadow-sm">
                <img 
                  src={(selectedProduct && selectedLid ? getCombinationImage(selectedProduct.id, selectedLid.id) : null) || selectedProduct?.image || group.image || "/image/Placeholder.jpg"} 
                  alt="Product" 
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <div className="flex-1 pt-1 pr-6">
                {displayOriginalPrice && (
                  <div className="text-xs text-gray-400 line-through">
                    Rp {displayOriginalPrice.toLocaleString('id-ID')}
                  </div>
                )}
                <div className="text-primary font-bold text-lg mb-0.5">
                  Rp {displayPrice.toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-500 mb-0.5">
                  Stok: {selectedProduct ? maxStock : group.products.reduce((acc, p) => acc + p.stock, 0)}
                </div>
                {selectedProduct && (
                  <div className="text-[13px] text-gray-800 line-clamp-1">
                    Varian: {selectedProduct.name} {selectedLid ? `+ ${selectedLid.name}` : ''}
                  </div>
                )}
              </div>
            </div>
            <SheetTitle className="sr-only">Pilih Varian</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div>
              <h3 className="text-[13px] font-medium text-gray-800 mb-3 uppercase">{group.productGroupName || "Varian Cup"}</h3>
              <div className="flex flex-wrap gap-2">
                {group.products.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const isOutOfStock = p.stock === 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isOutOfStock && handleSelect(p)}
                      disabled={isOutOfStock}
                      className={`min-h-[36px] py-1 px-3 flex items-center gap-2 text-[13px] font-medium rounded-sm border shrink-0 transition-all duration-200 ${
                        isSelected 
                          ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' 
                          : isOutOfStock
                            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-200 text-gray-700 bg-gray-50 hover:border-primary/50'
                      }`}
                    >
                      {p.image && <img src={p.image} className="w-6 h-6 rounded-sm object-cover" />}
                      {p.optionName || p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {lids.length > 0 && selectedProduct && (
              <div>
                <h3 className="text-[13px] font-medium text-gray-800 mb-3 uppercase">{group.lidGroupName || "Varian Tutup"}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectLid(null)}
                    className={`min-h-[36px] py-1 px-3 text-[13px] font-medium rounded-sm border shrink-0 transition-all duration-200 ${
                      selectedLid === null 
                        ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-gray-200 text-gray-700 bg-gray-50 hover:border-primary/50'
                    }`}
                  >
                    Tanpa {group.lidGroupName || "Tutup"}
                  </button>
                  {lids.map((lid) => {
                    const isSelected = selectedLid?.id === lid.id;
                    const isOutOfStock = lid.stock === 0;
                    return (
                      <button
                        key={lid.id}
                        onClick={() => !isOutOfStock && handleSelectLid(lid)}
                        disabled={isOutOfStock}
                        className={`min-h-[36px] py-1 px-3 flex items-center gap-2 text-[13px] font-medium rounded-sm border shrink-0 transition-all duration-200 ${
                          isSelected 
                            ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary' 
                            : isOutOfStock
                              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'border-gray-200 text-gray-700 bg-gray-50 hover:border-primary/50'
                        }`}
                      >
                        {lid.image && <img src={lid.image} className="w-6 h-6 rounded-sm object-cover" />}
                        {lid.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-[13px] font-medium text-gray-800">Jumlah</span>
              <div className="flex items-center border border-gray-200 rounded-sm">
                <button 
                  onClick={handleDecrease}
                  disabled={!selectedProduct || quantity <= minOrder}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Minus size={14} />
                </button>
                <div className="w-12 h-8 flex items-center justify-center border-l border-r border-gray-200 text-sm font-medium">
                  {quantity}
                </div>
                <button 
                  onClick={handleIncrease}
                  disabled={!selectedProduct || (quantity + orderStep) > maxStock}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <button 
              onClick={handleAddToCartFromSheet}
              className={`w-full h-[44px] rounded flex items-center justify-center font-bold text-[15px] transition-colors ${!selectedProduct ? 'bg-gray-100 text-gray-400' : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'}`}
            >
              Masukkan Keranjang
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ProductGroup, Product, AddOnProduct, ModePrice } from "@/types";
import { useCartStore } from "@/stores/useCartStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart, AlertCircle, MessageSquare, Heart, ShieldCheck, ZoomIn, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { useCloseOnBack } from "@/hooks/use-close-on-back";

interface ProductActionsProps {
  group: ProductGroup;
  onImageChange?: (image: string, gallery?: string[]) => void;
}

type ProductCombination = {
  id?: number | string;
  product_option_id: number | string;
  lid_option_id: number | string;
  price?: number;
  salePrice?: number;
  image?: string;
  modePrices?: ModePrice[];
};

export default function ProductActions({ group, onImageChange }: ProductActionsProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lids, setLids] = useState<AddOnProduct[]>([]);
  const [selectedLid, setSelectedLid] = useState<AddOnProduct | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModePrice | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);
  const { isLoggedIn } = useCurrentCustomer();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const allowWithoutLid = selectedProduct?.allowWithoutLid !== false;
  const hasLidGroup = Boolean((group as ProductGroup & { _lids?: AddOnProduct[] })._lids?.length);
  const lidSelectionRequired = Boolean(selectedProduct) && !allowWithoutLid && hasLidGroup;

  const combinations: ProductCombination[] =
    (group as ProductGroup & { _combinations?: ProductCombination[] })._combinations || [];

  // Mode dipilih lebih dulu, jadi daftarnya diambil dari gabungan seluruh opsi produk & kombinasi.
  const groupModePrices: ModePrice[] = useMemo(() => {
    const collected = new Map<string, ModePrice>();
    const collect = (prices?: ModePrice[]) => {
      (prices || []).forEach((price) => {
        if (!collected.has(price.slug)) collected.set(price.slug, price);
      });
    };
    group.products.forEach((p) => collect(p.modePrices));
    ((group as ProductGroup & { _combinations?: ProductCombination[] })._combinations || [])
      .forEach((c) => collect(c.modePrices));
    return Array.from(collected.values()).sort((a, b) => a.priceModeId - b.priceModeId);
  }, [group]);

  const findCombination = (productId: string, lidId: string) =>
    combinations.find(
      (c) => String(c.product_option_id) === String(productId) && String(c.lid_option_id) === String(lidId),
    );

  const modePricesFor = (product: Product, lid: AddOnProduct | null) => {
    const combination = lid ? findCombination(product.id, lid.id) : undefined;
    return combination?.modePrices?.length ? combination.modePrices : (product.modePrices || []);
  };

  const productSupportsMode = (p: Product, modeSlug: string) =>
    Boolean(p.modePrices?.some((price) => price.slug === modeSlug))
    || combinations.some(
      (c) => String(c.product_option_id) === String(p.id)
        && (c.modePrices || []).some((price) => price.slug === modeSlug),
    );

  const productSelectionLocked = groupModePrices.length > 0 && !selectedMode;

  const isProductDisabled = (p: Product) =>
    p.stock === 0 || productSelectionLocked || Boolean(selectedMode && !productSupportsMode(p, selectedMode.slug));

  // Kombinasi varian + tutup tertentu bisa saja tidak menyediakan mode yang sedang dipilih.
  const lidOptionSupportsMode = (lid: AddOnProduct | null) => {
    if (!selectedProduct || !selectedMode) return true;
    return modePricesFor(selectedProduct, lid).some((price) => price.slug === selectedMode.slug);
  };

  const isLidDisabled = (lid: AddOnProduct) => lid.stock === 0 || !lidOptionSupportsMode(lid);

  const getModePriceLabel = (mode: ModePrice) => {
    if (selectedProduct) {
      const match = availableModePrices.find((price) => price.slug === mode.slug);
      return match ? `Rp ${match.price.toLocaleString("id-ID")}` : null;
    }
    const prices = [
      ...group.products.flatMap((p) => p.modePrices || []),
      ...combinations.flatMap((c) => c.modePrices || []),
    ]
      .filter((price) => price.slug === mode.slug)
      .map((price) => price.price);
    return prices.length ? `Mulai Rp ${Math.min(...prices).toLocaleString("id-ID")}` : null;
  };

  // Back button closes the sheet / image preview instead of leaving the page.
  useCloseOnBack(isSheetOpen, () => setIsSheetOpen(false));
  useCloseOnBack(isImagePreviewOpen, () => setIsImagePreviewOpen(false));

  useEffect(() => {
    if (!isImagePreviewOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsImagePreviewOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isImagePreviewOpen]);

  const handleAddToCartFromSheet = () => {
    if (handleAddToCart()) setIsSheetOpen(false);
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

  const handleSelectMode = (mode: ModePrice) => {
    setSelectedMode(mode);
    if (!selectedProduct) return;

    // Varian yang tidak punya mode ini tidak boleh tetap terpilih.
    if (!productSupportsMode(selectedProduct, mode.slug)) {
      setSelectedProduct(null);
      setSelectedLid(null);
      setQuantity(1);
      if (onImageChange) {
        onImageChange(
          group.image || "/image/Placeholder.jpg",
          group.gallery || [group.image || "/image/Placeholder.jpg"],
        );
      }
      return;
    }

    // Varian tetap valid, tapi kombinasinya dengan tutup terpilih belum tentu punya mode ini.
    if (selectedLid && !modePricesFor(selectedProduct, selectedLid).some((price) => price.slug === mode.slug)) {
      setSelectedLid(null);
      if (onImageChange) {
        onImageChange(
          selectedProduct.image || group.image || "/image/Placeholder.jpg",
          selectedProduct.gallery || group.gallery || [group.image || "/image/Placeholder.jpg"],
        );
      }
    }
  };

  const handleSelect = (p: Product) => {
    setSelectedProduct(p);
    setQuantity(p.minimumOrder || 1);
    // Tutup yang kombinasinya tidak menyediakan mode terpilih ikut dilepas.
    const keepLid = selectedLid && (!selectedMode
      || modePricesFor(p, selectedLid).some((price) => price.slug === selectedMode.slug));
    if (!keepLid) setSelectedLid(null);
    if (onImageChange) {
      const comboImage = keepLid && selectedLid ? getCombinationImage(p.id, selectedLid.id) : null;
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
    if (!selectedMode) {
      toast.error("Silakan pilih mode terlebih dahulu");
      return false;
    }

    if (!selectedProduct) {
      toast.error("Silakan pilih varian terlebih dahulu");
      return false;
    }

    if (lidSelectionRequired && !selectedLid) {
      toast.error("Silakan pilih tutup terlebih dahulu", {
        description: "Produk ini wajib menggunakan tutup."
      });
      return false;
    }
    
    if (!isLoggedIn) {
      toast.error("Silakan login", {
        description: "Anda harus login terlebih dahulu untuk menambah produk ke keranjang."
      });
      router.push("/login");
      return false;
    }

    addItem(group, selectedProduct, quantity, selectedModePrice || selectedMode, displayPrice, selectedLid || undefined);
    toast.success("Berhasil Ditambahkan", {
      description: `${quantity.toLocaleString("id-ID")}x ${selectedProduct.name}${selectedLid ? ` + ${selectedLid.name}` : ''} ditambahkan.`
    });
    return true;
  };



  const selectedCombination = selectedProduct && selectedLid
    ? (group as any)._combinations?.find(
        (combination: any) => String(combination.product_option_id) === String(selectedProduct.id)
          && String(combination.lid_option_id) === String(selectedLid.id),
      )
    : null;

  const availableModePrices: ModePrice[] = selectedCombination?.modePrices?.length
    ? selectedCombination.modePrices
    : (selectedProduct?.modePrices || []);


  const selectedModePrice = availableModePrices.find((price) => price.slug === selectedMode?.slug);
  const comboPricing = selectedCombination && selectedModePrice
    ? { price: selectedModePrice.price, salePrice: undefined }
    : null;
  const canShowPrice = !lidSelectionRequired || Boolean(selectedLid);
  
  const displayPrice = selectedProduct 
    ? (
        comboPricing 
          ? (comboPricing.salePrice || comboPricing.price)
          : (selectedModePrice?.price ?? ((selectedProduct.salePrice || selectedProduct.price) + (selectedLid ? (selectedLid.salePrice || selectedLid.price) : 0)))
      )
    : Math.min(...group.products.map(p => p.salePrice ?? p.price));

  const displayOriginalPrice = selectedProduct
    ? (
        comboPricing
          ? (comboPricing.salePrice ? comboPricing.price : undefined)
          : ((selectedProduct.salePrice || (selectedLid && selectedLid.salePrice)) 
              ? (selectedProduct.price + (selectedLid ? selectedLid.price : 0)) 
              : undefined)
      )
    : undefined;

  const currentProductImage =
    (selectedProduct && selectedLid ? getCombinationImage(selectedProduct.id, selectedLid.id) : null)
    || selectedProduct?.image
    || group.image
    || "/image/Placeholder.jpg";
    
  return (
    <div className="mt-2">
      
      {/* Price Display */}
      <div className="mb-3 px-3 md:px-0">
        <div className="flex items-end gap-1 md:gap-2">
          {!selectedProduct && <span className="text-xs text-gray-500 mb-0.5">Mulai dari</span>}
          {canShowPrice && displayOriginalPrice && (
            <span className="text-sm font-medium text-gray-400 line-through mb-1">
              Rp {displayOriginalPrice.toLocaleString('id-ID')}
            </span>
          )}
          {canShowPrice ? (
            <span className="text-2xl font-bold text-primary tracking-tight">
              Rp {displayPrice.toLocaleString('id-ID')}
            </span>
          ) : (
            <span className="text-sm font-semibold text-amber-600">
              Pilih tutup untuk melihat harga
            </span>
          )}
        </div>
      </div>

      {/* Mode Options — dipilih paling awal */}
      {groupModePrices.length > 0 && (
        <div className="border-t-[6px] border-gray-100 md:border-t md:border-gray-100 pt-3 md:pt-3 pb-2 px-3 md:px-0">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">Mode</h3>
            {!selectedMode && <span className="text-[10px] font-semibold text-red-600">Wajib pilih mode</span>}
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {groupModePrices.map((mode) => {
              const priceLabel = getModePriceLabel(mode);
              return (
                <button key={mode.slug} type="button" onClick={() => handleSelectMode(mode)}
                  className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border transition-all ${selectedMode?.slug === mode.slug ? "border-primary text-primary bg-blue-50 ring-1 ring-primary" : "border-gray-300 text-gray-700 hover:border-primary/50"}`}>
                  {mode.name}{priceLabel ? ` · ${priceLabel}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Options */}
      <div className="border-t-[6px] border-gray-100 md:border-t md:border-gray-100 pt-3 md:pt-3 pb-2 px-3 md:px-0">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className={`text-xs md:text-xs font-bold md:font-semibold md:uppercase md:tracking-wide ${productSelectionLocked ? 'text-gray-400 md:text-gray-400' : 'text-gray-800 md:text-gray-500'}`}>{group.productGroupName || "Opsi Produk"}</h3>
          {productSelectionLocked
            ? <span className="text-[10px] font-semibold text-amber-600">Pilih mode dulu</span>
            : <span className="text-[10px] text-gray-500 md:hidden">Pilih &gt;</span>}
        </div>
        <div className="flex flex-wrap gap-2 md:gap-2 pb-1">
          {group.products.map((p) => {
            const isSelected = selectedProduct?.id === p.id;
            const isDisabled = isProductDisabled(p);
            return (
              <button
                key={p.id}
                onClick={() => !isDisabled && handleSelect(p)}
                disabled={isDisabled}
                className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary'
                    : isDisabled
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
            <h3 className="text-xs md:text-xs font-bold md:font-semibold text-gray-800 md:text-gray-500 md:uppercase md:tracking-wide">{group.lidGroupName || "Opsi Tutup"}</h3>
            {lidSelectionRequired && <span className="text-[10px] font-semibold text-red-600">Wajib pilih tutup</span>}
          </div>
          <div className="flex flex-wrap gap-2 md:gap-2 pb-1">
            {allowWithoutLid && (
            <button
              onClick={() => lidOptionSupportsMode(null) && handleSelectLid(null)}
              disabled={!lidOptionSupportsMode(null)}
              className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                selectedLid === null
                  ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary'
                  : !lidOptionSupportsMode(null)
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:border-primary/50'
              }`}
            >
              Tanpa {group.lidGroupName || "Tutup"}
            </button>
            )}
            {lids.map((lid) => {
              const isSelected = selectedLid?.id === lid.id;
              const isDisabled = isLidDisabled(lid);
              return (
                <button
                  key={lid.id}
                  onClick={() => !isDisabled && handleSelectLid(lid)}
                  disabled={isDisabled}
                  className={`h-9 md:h-8 px-4 md:px-3 text-sm md:text-xs font-medium rounded-md border whitespace-nowrap shrink-0 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary text-primary bg-blue-50 ring-1 ring-primary'
                      : isDisabled
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 text-gray-700 hover:border-primary/50'
                  }`}
                >
                  {lid.name}
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
              <span className="text-gray-500">Terpilih: </span>
              <span className="font-medium text-gray-900">{selectedProduct.name}</span>
              {selectedMode && <span className="text-gray-500"> · Mode: <span className="font-medium text-gray-900">{selectedMode.name}</span></span>}
              {lids.length > 0 && (allowWithoutLid || selectedLid) && (
                <span className="text-gray-500"> · {group.lidGroupName || "Tutup"}: <span className="font-medium text-gray-900">{selectedLid ? selectedLid.name : `Tanpa ${group.lidGroupName || "Tutup"}`}</span></span>
              )}
            </div>
            <span className={`font-bold whitespace-nowrap ${canShowPrice ? 'text-primary' : 'text-amber-600'}`}>
              {canShowPrice ? `Rp ${displayPrice.toLocaleString('id-ID')}` : 'Pilih tutup'}
            </span>
          </div>
        </div>
      )}

      {/* Desktop Quantity Block */}
      <div className="hidden md:block pt-3 pb-3 px-3 md:px-0 md:pt-0 md:pb-0 mb-3">
        <div className="flex items-center justify-between md:justify-start">
          <span className="text-sm font-bold text-gray-800 md:font-medium md:text-xs md:text-gray-700 md:w-20">Jumlah</span>
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
                {quantity.toLocaleString("id-ID")}
              </div>
              <button 
                onClick={handleIncrease}
                disabled={!selectedProduct || (quantity + orderStep) > maxStock}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
              {group.unitName || "Pcs"}
            </span>
            <span className="text-xs text-gray-500 md:ml-3">
              Maksimal Qty: <span className="font-medium text-gray-700">{selectedProduct ? maxStock : group.products.reduce((acc, p) => acc + p.stock, 0)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        {(!selectedMode || !selectedProduct) && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-3 text-xs font-medium border border-amber-200">
            <AlertCircle size={14} />
            {!selectedMode
              ? "Silakan pilih mode terlebih dahulu."
              : "Silakan pilih varian terlebih dahulu."}
          </div>
        )}

        <div className="flex gap-3">
          <button 
            onClick={handleAddToCart}
            disabled={!selectedProduct || !selectedMode || (lidSelectionRequired && !selectedLid)}
            className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold text-sm rounded-md hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <ShoppingCart size={18} />
            Masukkan Keranjang
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
        <SheetContent
          side="bottom"
          className="data-[side=bottom]:h-[78dvh] data-[side=bottom]:max-h-[calc(100dvh-env(safe-area-inset-top))] gap-0 overflow-hidden rounded-t-2xl border-none px-0 pb-0 pt-3 md:hidden z-[100]"
        >
          <SheetHeader className="px-4 pb-3 text-left border-b border-gray-100 shrink-0 relative">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(true)}
                aria-label="Perbesar gambar produk"
                className="group/image w-24 h-24 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200 relative -mt-6 bg-white p-1 shadow-sm cursor-zoom-in"
              >
                <img 
                  src={currentProductImage}
                  alt={selectedProduct?.name || group.name}
                  className="w-full h-full object-contain rounded transition-transform group-hover/image:scale-105"
                />
                <span className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white shadow-sm">
                  <ZoomIn size={13} />
                </span>
              </button>
              <div className="min-w-0 flex-1 pt-1 pr-6">
                {canShowPrice && displayOriginalPrice && (
                  <div className="text-xs text-gray-400 line-through">
                    Rp {displayOriginalPrice.toLocaleString('id-ID')}
                  </div>
                )}
                {canShowPrice ? (
                  <div className="text-primary font-bold text-lg mb-0.5">
                    Rp {displayPrice.toLocaleString('id-ID')}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-amber-600 mb-0.5">
                    Pilih tutup untuk melihat harga
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-0.5">
                  Stok: {selectedProduct ? maxStock : group.products.reduce((acc, p) => acc + p.stock, 0)}
                </div>
                {selectedProduct && (
                  <div className="text-[13px] leading-snug text-gray-800 whitespace-normal break-words">
                    Varian: {selectedProduct.name} {selectedLid ? `+ ${selectedLid.name}` : ''}
                  </div>
                )}
              </div>
            </div>
            <SheetTitle className="sr-only">Pilih Varian</SheetTitle>
          </SheetHeader>
          
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 py-4 space-y-6">
            {groupModePrices.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-[13px] font-medium uppercase text-gray-800">Mode</h3>
                  {!selectedMode && (
                    <span className="text-xs font-semibold text-red-600">Wajib pilih mode</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupModePrices.map((mode) => {
                    const priceLabel = getModePriceLabel(mode);
                    return (
                      <button key={mode.slug} type="button" onClick={() => handleSelectMode(mode)}
                        className={`min-h-[40px] w-full px-2 text-left text-[13px] font-medium rounded-sm border transition-all ${selectedMode?.slug === mode.slug ? "border-primary text-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 text-gray-700 bg-gray-50 hover:border-primary/50"}`}>
                        <span className="block">{mode.name}</span>
                        {priceLabel && <span className="block text-[11px]">{priceLabel}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className={`text-[13px] font-medium uppercase ${productSelectionLocked ? 'text-gray-400' : 'text-gray-800'}`}>{group.productGroupName || "Varian Cup"}</h3>
                {productSelectionLocked && (
                  <span className="text-xs font-semibold text-amber-600">Pilih mode dulu</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.products.map((p) => {
                  const isSelected = selectedProduct?.id === p.id;
                  const isDisabled = isProductDisabled(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isDisabled && handleSelect(p)}
                      disabled={isDisabled}
                      className={`min-h-[36px] w-full min-w-0 py-1 px-2 flex items-center gap-2 text-left text-[13px] leading-tight font-medium rounded-sm border transition-all duration-200 ${
                        isSelected
                          ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary'
                          : isDisabled
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
                {lidSelectionRequired && <p className="mb-2 text-xs font-semibold text-red-600">Wajib pilih tutup</p>}
                <div className="grid grid-cols-2 gap-2">
                  {allowWithoutLid && (
                  <button
                    onClick={() => lidOptionSupportsMode(null) && handleSelectLid(null)}
                    disabled={!lidOptionSupportsMode(null)}
                    className={`min-h-[36px] w-full min-w-0 py-1 px-2 text-left text-[13px] leading-tight font-medium rounded-sm border transition-all duration-200 ${
                      selectedLid === null
                        ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary'
                        : !lidOptionSupportsMode(null)
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-gray-200 text-gray-700 bg-gray-50 hover:border-primary/50'
                    }`}
                  >
                    Tanpa {group.lidGroupName || "Tutup"}
                  </button>
                  )}
                  {lids.map((lid) => {
                    const isSelected = selectedLid?.id === lid.id;
                    const isDisabled = isLidDisabled(lid);
                    return (
                      <button
                        key={lid.id}
                        onClick={() => !isDisabled && handleSelectLid(lid)}
                        disabled={isDisabled}
                        className={`min-h-[36px] w-full min-w-0 py-1 px-2 flex items-center gap-2 text-left text-[13px] leading-tight font-medium rounded-sm border transition-all duration-200 ${
                          isSelected
                            ? 'border-primary text-primary bg-primary/5 ring-1 ring-primary'
                            : isDisabled
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

          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="flex items-center justify-between pb-3">
              <span className="text-[13px] font-medium text-gray-800">Jumlah</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-200 rounded-sm">
                  <button
                    onClick={handleDecrease}
                    disabled={!selectedProduct || quantity <= minOrder}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="w-12 h-8 flex items-center justify-center border-l border-r border-gray-200 text-sm font-medium">
                    {quantity.toLocaleString("id-ID")}
                  </div>
                  <button
                    onClick={handleIncrease}
                    disabled={!selectedProduct || (quantity + orderStep) > maxStock}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-gray-50 px-2.5 text-xs font-semibold text-gray-700">
                  {group.unitName || "Pcs"}
                </span>
              </div>
            </div>
            <button 
              onClick={handleAddToCartFromSheet}
              disabled={!selectedProduct || !selectedMode || (lidSelectionRequired && !selectedLid)}
              className={`w-full h-[44px] rounded flex items-center justify-center font-bold text-[15px] transition-colors ${!selectedProduct || !selectedMode || (lidSelectionRequired && !selectedLid) ? 'bg-gray-100 text-gray-400' : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90'}`}
            >
              Masukkan Keranjang
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {isImagePreviewOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview gambar produk"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setIsImagePreviewOpen(false)}
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
              src={currentProductImage}
              alt={selectedProduct?.name || group.name}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

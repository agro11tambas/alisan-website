"use client";

import { useCartStore } from "@/stores/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Discount, getActiveDiscounts } from "@/services/discountService";
import { calculateDiscountAmount, calculateItemDiscounts } from "@/utils/discountUtils";

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const cart = useCartStore();
  
  const itemDiscounts = calculateItemDiscounts(cart.items, discounts);

  useEffect(() => {
    setIsMounted(true);
    getActiveDiscounts().then(setDiscounts);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="bg-gray-50 min-h-screen pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-8">
      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 mt-4 md:mt-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-4 max-w-md">
            Discover our latest products and promotions.
          </p>
          <Link href="/products" className="h-10 px-6 flex items-center justify-center bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="w-full sm:container sm:mx-auto sm:px-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            
            {/* Cart Items List */}
            <div className="flex-1">
              <div className="bg-gray-50 sm:bg-white sm:rounded-md sm:border sm:border-gray-200 overflow-hidden">
                
                {/* Shop Group Header */}
                <div className="h-10 px-3 border-b border-gray-100 flex items-center justify-between bg-white mt-2 sm:mt-0">
                  <div className="text-sm font-medium text-gray-900">
                    Keranjang Saya
                  </div>
                  <button className="text-sm text-gray-500">Edit</button>
                </div>

                <div className="bg-white">
                  {cart.items.map((item) => {
                    const itemDiscount = itemDiscounts[item.id] || 0;
                    const itemPrice = item.price;
                    const itemDiscountedPrice = itemPrice - (itemDiscount / item.quantity);
                    const itemTotal = item.price * item.quantity;
                    const itemDiscountedTotal = itemTotal - itemDiscount;

                    return (
                      <div key={item.id} className="py-3 px-3 border-b border-gray-100 last:border-0 relative flex gap-2">
                      
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-sm overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.displayName}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex flex-col flex-1 min-w-0 pr-8">
                        <Link href={`/products/${item.groupSlug || item.productGroupId}`} className="text-base font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {item.groupName}
                        </Link>
                        
                        <div className="mt-0.5 text-sm text-gray-600">
                          {item.mainProductName}
                          {item.type === 'bundle' && item.addOnProductName && ` + ${item.addOnProductName}`}
                        </div>

                        {/* Grid Table */}
                        <div className="w-full sm:w-fit mt-1 sm:mt-2">
                          <table className="text-left border-collapse block sm:table w-full sm:w-auto">
                            <thead className="hidden sm:table-header-group">
                              <tr>
                                <th className="text-xs font-semibold text-gray-400 uppercase pb-2 pr-8 font-sans tracking-wide">Harga</th>
                                <th className="text-xs font-semibold text-gray-400 uppercase pb-2 pr-8 text-center font-sans tracking-wide">Qty</th>
                                <th className="text-xs font-semibold text-gray-400 uppercase pb-2 text-left font-sans tracking-wide">Total</th>
                              </tr>
                            </thead>
                            <tbody className="block sm:table-row-group w-full">
                              <tr className="flex flex-col gap-2.5 sm:table-row sm:gap-0 mt-1.5 sm:mt-0">
                                <td className="block sm:table-cell align-middle pr-0 sm:pr-8">
                                  {itemDiscount > 0 ? (
                                    <div className="flex flex-row gap-2 sm:flex-col sm:gap-0 text-[13px] sm:text-sm font-medium items-center sm:items-start">
                                      <span className="line-through text-gray-400">Rp {itemPrice.toLocaleString('id-ID')}</span>
                                      <span className="text-green-600 sm:mt-0.5">Rp {itemDiscountedPrice.toLocaleString('id-ID')}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[13px] sm:text-sm font-medium text-gray-900">Rp {itemPrice.toLocaleString('id-ID')}</span>
                                  )}
                                </td>
                                <td className="block sm:table-cell align-middle pr-0 sm:pr-8">
                                  <div className="flex sm:mx-auto items-center border border-gray-200 rounded-sm w-fit bg-white">
                                    <button
                                      onClick={() => cart.updateQuantity(item.id, Math.max(item.minOrder, item.quantity - item.orderStep))}
                                      disabled={item.quantity <= item.minOrder}
                                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <div className="min-w-[40px] px-2 sm:min-w-[48px] h-8 flex items-center justify-center border-x border-gray-200 text-sm font-medium bg-white">
                                      {item.quantity}
                                    </div>
                                    <button
                                      onClick={() => cart.updateQuantity(item.id, Math.min(item.stock, item.quantity + item.orderStep))}
                                      disabled={(item.quantity + item.orderStep) > item.stock}
                                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                </td>
                                <td className="block sm:table-cell align-middle text-left">
                                  {itemDiscount > 0 ? (
                                    <div className="flex flex-row gap-2 sm:flex-col sm:gap-0 text-[13px] sm:text-sm font-bold text-primary items-center sm:items-start">
                                      <span className="line-through text-gray-400 font-normal">Rp {itemTotal.toLocaleString('id-ID')}</span>
                                      <span className="sm:mt-0.5">Rp {itemDiscountedTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[13px] sm:text-sm font-bold text-primary">Rp {itemTotal.toLocaleString('id-ID')}</span>
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => cart.removeItem(item.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  );
                })}
                </div>
              </div>
            </div>

            {/* Desktop Order Summary (Hidden on Mobile) */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="bg-white border border-gray-200 p-4 sticky top-24">
                <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Ringkasan Belanja</h2>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Harga</span>
                  <span className="text-sm font-medium text-gray-900">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
                </div>
                {calculateDiscountAmount(cart.items, discounts) > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-green-600">Diskon</span>
                    <span className="text-sm font-medium text-green-600">- Rp {calculateDiscountAmount(cart.items, discounts).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total Tagihan</span>
                  <span className="text-lg font-bold text-primary">Rp {(cart.getSubtotal() - calculateDiscountAmount(cart.items, discounts)).toLocaleString('id-ID')}</span>
                </div>
                <Link
                href="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 px-4 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-sm hover:shadow"
              >
                Checkout ({cart.items.length})
              </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Sticky Checkout Bar */}
      {cart.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between h-10">
            <div className="flex flex-col justify-center">
              <span className="text-xs font-medium text-gray-500">Total Tagihan</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-primary">
                  Rp {(cart.getSubtotal() - calculateDiscountAmount(cart.items, discounts)).toLocaleString('id-ID')}
                </span>
                {calculateDiscountAmount(cart.items, discounts) > 0 && (
                  <span className="text-xs line-through text-gray-400">
                    Rp {cart.getSubtotal().toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
            <Link 
              href="/checkout"
              className="h-10 px-5 flex items-center justify-center bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors w-auto"
            >
              Checkout ({cart.items.length})
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

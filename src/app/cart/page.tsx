"use client";

import { useCartStore } from "@/stores/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCartStore();

  useEffect(() => {
    setIsMounted(true);
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
          <Link href="/products" className="h-10 px-6 flex items-center justify-center bg-[#0021F3] text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
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
                  {cart.items.map((item) => (
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
                        <Link href={`/products/${item.productGroupId}`} className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 leading-tight">
                          {item.groupName} - {item.mainProductName}
                        </Link>
                        
                        {item.type === 'bundle' && item.addOnProductName && (
                          <div className="mt-1">
                            <p className="text-sm text-blue-600">+ {item.addOnProductName}</p>
                          </div>
                        )}

                        {/* Price Section */}
                        <div className="mt-2">
                          <div className="text-base font-semibold text-primary leading-tight">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="mt-2 flex items-center border border-gray-200 rounded-sm w-fit bg-white">
                          <button
                            onClick={() => cart.updateQuantity(item.id, Math.max(item.minOrder, item.quantity - item.orderStep))}
                            disabled={item.quantity <= item.minOrder}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="w-8 h-8 flex items-center justify-center border-x border-gray-200 text-sm font-medium bg-white">
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
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Order Summary (Hidden on Mobile) */}
            <div className="hidden lg:block w-80 shrink-0">
              <div className="bg-white border border-gray-200 p-4 sticky top-24">
                <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Ringkasan Belanja</h2>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-900 font-medium">Total Harga</span>
                  <span className="text-base font-bold text-primary">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <Link 
                  href="/checkout"
                  className="w-full h-10 flex items-center justify-center bg-[#0021F3] text-white text-sm font-medium rounded-md hover:bg-[#0021F3]/90 transition-colors"
                >
                  Checkout ({cart.getTotalCount()})
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
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">Total</span>
              <span className="text-base font-semibold text-primary ml-1">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
            </div>
            <Link 
              href="/checkout"
              className="h-10 px-5 flex items-center justify-center bg-[#0021F3] text-white text-sm font-medium rounded-md hover:bg-[#0021F3]/90 transition-colors w-auto"
            >
              Checkout ({cart.getTotalCount()})
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

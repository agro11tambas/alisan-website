"use client";

import { useCartStore } from "@/stores/useCartStore";
import { useAddressStore } from "@/stores/useAddressStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShoppingBag, ChevronRight, MessageCircle, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { informationService } from "@/services/informationService";
import { orderService } from "@/services/orderService";

const addressSchema = z.object({
  businessName: z.string().optional(),
  completeAddress: z.string().min(10, "Please provide a complete address"),
  googleMapsLink: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  
  const cart = useCartStore();
  const addressStore = useAddressStore();
  const router = useRouter();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      isDefault: false,
    }
  });

  useEffect(() => {
    setIsMounted(true);
    if (isMounted && cart.items.length === 0) {
      router.push('/cart');
    }
  }, [isMounted, cart.items.length, router]);

  useEffect(() => {
    if (isMounted) {
      if (addressStore.addresses.length > 0 && !selectedAddressId) {
        const defaultAddress = addressStore.addresses.find(a => a.isDefault);
        setSelectedAddressId(defaultAddress ? defaultAddress.id : addressStore.addresses[0].id);
      } else if (addressStore.addresses.length === 0) {
        setShowAddressForm(true);
      }
    }
  }, [isMounted, addressStore.addresses, selectedAddressId]);

  if (!isMounted || cart.items.length === 0) return null;

  const handleOpenNewForm = () => {
    setEditingAddressId(null);
    reset({
      businessName: "",
      completeAddress: "",
      googleMapsLink: "",
      isDefault: addressStore.addresses.length === 0,
    });
    setShowAddressForm(true);
  };

  const handleOpenEditForm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const addr = addressStore.addresses.find(a => a.id === id);
    if (addr) {
      setEditingAddressId(id);
      reset({
        businessName: addr.businessName || "",
        completeAddress: addr.completeAddress,
        googleMapsLink: addr.googleMapsLink || "",
        isDefault: addr.isDefault,
      });
      setShowAddressForm(true);
    }
  };

  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = (data: AddressFormValues) => {
    const addressData = {
      businessName: data.businessName,
      completeAddress: data.completeAddress,
      googleMapsLink: data.googleMapsLink,
      isDefault: !!data.isDefault,
    };

    if (editingAddressId) {
      addressStore.updateAddress(editingAddressId, addressData);
      setSelectedAddressId(editingAddressId);
    } else {
      addressStore.addAddress(addressData);
      
      setTimeout(() => {
        const updatedStore = useAddressStore.getState();
        const newestAddress = updatedStore.addresses[updatedStore.addresses.length - 1];
        if (newestAddress) {
          setSelectedAddressId(newestAddress.id);
        }
      }, 50);
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  const handleCheckout = async () => {
    const selectedAddress = addressStore.addresses.find(a => a.id === selectedAddressId);
    
    if (!selectedAddress) {
      alert("Please select a shipping address first.");
      return;
    }

    let message = `*ORDER SUMMARY*\n`;
    message += `-------------------------\n`;
    message += `*Customer Info:*\n`;
    if (selectedAddress.businessName) {
      message += `🏢 Bisnis: ${selectedAddress.businessName}\n`;
    }
    message += `📍 Alamat: ${selectedAddress.completeAddress}\n`;
    if (selectedAddress.googleMapsLink) {
      message += `🗺️ Maps: ${selectedAddress.googleMapsLink}\n`;
    }
    message += `\n*Daftar Pesanan:*\n\n`;
    
    cart.items.forEach((item, index) => {
      if (item.type === 'bundle') {
        message += `${index + 1}. *${item.groupName} - ${item.mainProductName}*\n`;
        message += `   └ SKU: ${item.mainSku}\n`;
        message += `   └ Tambahan: ${item.addOnProductName}\n`;
        message += `   └ Qty: ${item.quantity}\n`;
        message += `   └ Harga Satuan: Rp ${item.price.toLocaleString('id-ID')}\n`;
        message += `   └ *Subtotal: Rp ${(item.price * item.quantity).toLocaleString('id-ID')}*\n\n`;
      } else {
        message += `${index + 1}. *${item.groupName} - ${item.mainProductName}*\n`;
        message += `   └ SKU: ${item.mainSku}\n`;
        message += `   └ Qty: ${item.quantity}\n`;
        message += `   └ Harga Satuan: Rp ${item.price.toLocaleString('id-ID')}\n`;
        message += `   └ *Subtotal: Rp ${(item.price * item.quantity).toLocaleString('id-ID')}*\n\n`;
      }
    });
    
    message += `-------------------------\n`;
    message += `*Total Pembayaran: Rp ${cart.getSubtotal().toLocaleString('id-ID')}*\n\n`;
    message += `Tolong di proses`;

    try {
      // POST order to backend API
      const orderPayload = {
        shipping: {
          business_name: selectedAddress.businessName || "",
          address: selectedAddress.completeAddress,
          google_maps: selectedAddress.googleMapsLink || "",
        },
        order_date: new Date().toISOString(),
        payment_method: "WhatsApp",
        paid_amount: 0,
        items: cart.items.map(item => ({
          ecommerce_product_id: Number(item.productGroupId),
          ecommerce_variant_combination_id: item.combinationId ? Number(item.combinationId) : undefined,
          variant_option_id: (!item.combinationId && String(item.mainProductId) !== String(item.productGroupId)) ? Number(item.mainProductId) : undefined,
          quantity: item.quantity,
          mode: "printing", // Add default mode as required by API
        })),
      };
      
      await orderService.createOrder(orderPayload);
      
      const info = await informationService.getInformation();
      let adminNumber = info?.phone_number ? info.phone_number.replace(/\D/g, '') : "6281234567890";
      
      // Ensure the number starts with 62 instead of 0 for Indonesian numbers
      if (adminNumber.startsWith('0')) {
        adminNumber = '62' + adminNumber.substring(1);
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminNumber}&text=${encodedMessage}`;

      cart.clearCart();
      
      // Try to open in a new tab
      const newWindow = window.open(whatsappUrl, '_blank');
      
      // If popup blocker prevents it, fallback to redirecting current tab
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.assign(whatsappUrl);
      } else {
        // Redirect the original tab to home page
        router.push('/');
      }
    } catch (error: any) {
      console.error("Failed to create order:", error);
      let errorMessage = "Terjadi kesalahan saat membuat pesanan, silakan coba lagi.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.errors) {
          const details = Object.values(error.response.data.errors).flat().join('\n');
          errorMessage += '\n' + details;
        }
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-[calc(env(safe-area-inset-bottom)+80px)] lg:pb-8">
      <div className="w-full sm:container sm:mx-auto sm:px-4 sm:py-6">
        
        {/* Desktop Breadcrumb */}
        <div className="hidden sm:flex items-center text-sm text-gray-500 mb-3 mt-4">
          <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
          <ChevronRight size={14} className="mx-1" />
          <span className="text-gray-900 font-medium">Checkout</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 sm:gap-6">
          
          {/* Main Content Column */}
          <div className="flex-1">
            
            {/* 1. SHIPPING ADDRESS SECTION */}
            <div className="bg-white border-b sm:border sm:rounded-md border-gray-200 mb-2 sm:mb-4 relative">
              <div className="flex items-center justify-between px-3 py-3 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="text-primary" size={16} />
                  Alamat Pengiriman
                </h2>
                {addressStore.addresses.length > 0 && !showAddressForm && (
                  <button onClick={handleOpenNewForm} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-0.5">
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
              
              {!showAddressForm && addressStore.addresses.length > 0 && (
                <div className="flex flex-col">
                  {addressStore.addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative px-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer flex items-start gap-3 transition-colors ${
                        selectedAddressId === addr.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Radio button circle */}
                      <div className="pt-0.5 shrink-0">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary' : 'border-gray-300'}`}>
                          {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{addr.businessName || 'Alamat Baru'}</span>
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold rounded">Utama</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">{addr.completeAddress}</div>
                      </div>

                      <button 
                        onClick={(e) => handleOpenEditForm(addr.id, e)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-2"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                  <form id="address-form" onSubmit={handleSubmit(handleSaveAddress)} className="space-y-3">
                    <div>
                      <input {...register("businessName")} className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none" placeholder="Business Name (Optional)" />
                    </div>
                    <div>
                      <textarea {...register("completeAddress")} rows={3} className={`w-full p-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none min-h-24 ${errors.completeAddress ? 'border-red-500' : 'border-gray-300'}`} placeholder="Complete Address *"></textarea>
                    </div>
                    <div>
                      <input {...register("googleMapsLink")} className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none" placeholder="Google Maps Link (Optional)" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isDefault" {...register("isDefault")} className="rounded text-primary focus:ring-primary w-4 h-4" />
                      <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">Set as default</label>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      {addressStore.addresses.length > 0 && (
                        <button type="button" onClick={handleCancelForm} className="flex-1 h-10 bg-white border border-gray-300 text-gray-700 text-sm rounded-md font-medium hover:bg-gray-50">
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="flex-1 h-10 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90">
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* 2. ORDER ITEM SECTION */}
            <div className="bg-white border-b sm:border sm:rounded-md border-gray-200 mb-2 sm:mb-4">
               {cart.items.map(item => (
                 <div key={item.id} className="flex gap-3 px-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="relative w-16 h-16 rounded-sm overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                      {item.image && (
                        <Image src={item.image} alt={item.displayName} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">{item.groupName}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {item.mainProductName}
                        {item.type === 'bundle' && item.addOnProductName && ` + ${item.addOnProductName}`}
                        {' - Rp ' + item.price.toLocaleString('id-ID')}
                      </div>
                      <div className="mt-1.5">
                        <span className="text-sm font-semibold text-primary">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                 </div>
               ))}
            </div>



            {/* 4. ORDER SUMMARY (Mobile) */}
            <div className="bg-white border-b sm:border sm:rounded-md border-gray-200 px-3 py-3 space-y-2 lg:hidden">
               <div className="flex justify-between">
                 <span className="text-sm text-gray-600">Subtotal untuk Produk</span>
                 <span className="text-sm text-gray-900">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-sm text-gray-600">Total Ongkos Kirim</span>
                 <span className="text-sm text-gray-900">Via WhatsApp</span>
               </div>
               <div className="flex justify-between pt-2">
                 <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                 <span className="text-base font-bold text-primary">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
               </div>
            </div>

          </div>

          {/* Desktop Sidebar (hidden on mobile) */}
          <div className="hidden lg:block w-80 shrink-0">
             <div className="bg-white rounded-md border border-gray-200 p-4 sticky top-24 space-y-3">
               <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                 <ShoppingBag size={16} className="text-primary" />
                 Ringkasan Pesanan
               </h2>
               <div className="flex justify-between">
                 <span className="text-sm text-gray-600">Subtotal Produk</span>
                 <span className="text-sm text-gray-900">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
               </div>
               <div className="flex justify-between pb-3 border-b border-gray-100">
                 <span className="text-sm text-gray-600">Ongkos Kirim</span>
                 <span className="text-sm text-gray-900">Via WhatsApp</span>
               </div>
               <div className="flex justify-between pb-3">
                 <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                 <span className="text-base font-bold text-primary">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
               </div>
               <button
                  onClick={handleCheckout}
                  disabled={addressStore.addresses.length === 0 || !selectedAddressId || showAddressForm}
                  className="w-full h-10 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={16} />
                  Checkout via WhatsApp
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* 5. FIXED BOTTOM BAR (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] flex items-center justify-end gap-3 h-[60px]">
        <div className="flex flex-col items-end flex-1">
          <span className="text-[13px] text-gray-900">Total Pembayaran</span>
          <span className="text-base font-bold text-primary leading-tight">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={addressStore.addresses.length === 0 || !selectedAddressId || showAddressForm}
          className="h-10 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 w-auto shrink-0"
        >
          <MessageCircle size={16} />
          Buat Pesanan
        </button>
      </div>
    </div>
  );
}

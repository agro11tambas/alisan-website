"use client";

import { useCartStore } from "@/stores/useCartStore";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShoppingBag, ChevronRight, MessageCircle, MapPin, Briefcase, User, Edit2, ZoomIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { informationService } from "@/services/informationService";
import { orderService } from "@/services/orderService";
import { Discount, getActiveDiscounts } from "@/services/discountService";
import { calculateDiscountAmount, calculateItemDiscounts } from "@/utils/discountUtils";
import ProductImagePreview from "@/components/common/ProductImagePreview";

const guestSchema = z.object({
  businessName: z.string().optional(),
  recipientName: z.string().min(3, "Nama penerima wajib diisi"),
  whatsappNumber: z.string().min(9, "Nomor WA tidak valid"),
  completeAddress: z.string().min(10, "Harap berikan alamat lengkap"),
  googleMapsLink: z.string().optional(),
});
type GuestFormValues = z.infer<typeof guestSchema>;

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  
  const cart = useCartStore();
  const selectedItems = cart.items.filter(i => i.isSelected !== false);
  const itemDiscounts = calculateItemDiscounts(selectedItems, discounts);
  const subtotal = cart.getSubtotal();
  const discountAmount = calculateDiscountAmount(selectedItems, discounts);
  const totalPayment = subtotal - discountAmount;
  const { customer, loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const router = useRouter();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | null>(null);
  
  const [formMode, setFormMode] = useState<'none' | 'guest'>('none');
  const [guestData, setGuestData] = useState<GuestFormValues | null>(null);

  const { register: registerGuest, handleSubmit: handleSubmitGuest, formState: { errors: guestErrors } } = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
  });

  useEffect(() => {
    setIsMounted(true);
    if (isMounted && selectedItems.length === 0) {
      router.push('/cart');
    }
    getActiveDiscounts().then(setDiscounts);
  }, [isMounted, selectedItems.length, router]);

  useEffect(() => {
    if (isMounted && !customerLoading) {
      if (!isLoggedIn) {
        router.push('/login?redirect=/checkout');
        return;
      }

      if (isLoggedIn && customer) {
        if (customer.customers && customer.customers.length > 0) {
          if (!selectedCustomerId) {
            setSelectedCustomerId(customer.customers[0].id);
          } else {
            const selectedCust = customer.customers.find(c => c.id === selectedCustomerId);
            if (selectedCust && selectedCust.addresses && selectedCust.addresses.length > 0 && !selectedAddressId) {
              const defaultAddr = selectedCust.addresses.find(a => a.is_default);
              setSelectedAddressId(defaultAddr ? defaultAddr.id : selectedCust.addresses[0].id);
            }
          }
        }
      } else {
        if (!guestData && formMode === 'none') {
          setFormMode('guest');
        }
      }
    }
  }, [isMounted, customerLoading, isLoggedIn, customer, selectedCustomerId, selectedAddressId, guestData]);

  if (!isMounted || selectedItems.length === 0) return null;

  const handleSaveGuest = (data: GuestFormValues) => {
    setGuestData(data);
    setFormMode('none');
  };

  const handleCheckout = async () => {
    let orderPayload: any = {
      order_date: new Date().toISOString(),
      payment_method: "WhatsApp",
      paid_amount: 0,
      items: selectedItems.map(item => ({
        ecommerce_product_id: Number(item.productGroupId),
        ecommerce_variant_combination_id: item.combinationId ? Number(item.combinationId) : undefined,
        variant_option_id: (!item.combinationId && String(item.mainProductId) !== String(item.productGroupId)) ? Number(item.mainProductId) : undefined,
        quantity: item.quantity,
        mode: item.modeSlug,
      })),
    };

    let selectedCust: any = null;
    let selectedAddr: any = null;

    if (isLoggedIn) {
      if (!selectedCustomerId || !selectedAddressId) {
        alert("Silakan pilih alamat pengiriman terlebih dahulu.");
        return;
      }
      orderPayload.customer_id = selectedCustomerId;
      orderPayload.customer_address_id = selectedAddressId;
      selectedCust = customer?.customers?.find(c => c.id === selectedCustomerId);
      selectedAddr = selectedCust?.addresses?.find((a: any) => a.id === selectedAddressId);
    } else {
      if (!guestData) {
        alert("Silakan isi alamat pengiriman terlebih dahulu.");
        return;
      }
      orderPayload.shipping = {
        business_name: guestData.businessName || "",
        recipient_name: guestData.recipientName,
        whatsapp_number: guestData.whatsappNumber,
        address: guestData.completeAddress,
        google_maps: guestData.googleMapsLink || "",
      };
    }

    try {
      const response = await orderService.createOrder(orderPayload);
      const invoiceNumber = response.data?.data?.order_number || "Menunggu Invoice";

      const cpName = isLoggedIn ? (customer?.name || customer?.fullName || "Pelanggan") : guestData?.recipientName;
      const cpPhone = isLoggedIn ? (customer?.whatsapp_number || customer?.whatsappNumber || "-") : guestData?.whatsappNumber;
      
      let message = `*ORDER SUMMARY*\n`;
      if (isLoggedIn && selectedAddr) {
        if (selectedAddr.business_name || selectedCust?.name) {
          message += `🏢 Business: ${selectedAddr.business_name || selectedCust?.name}\n`;
        }
        message += `📞 CP: ${cpName} - ${cpPhone}\n`;
        message += `📍 Alamat: ${selectedAddr.address}\n`;
        if (selectedAddr.google_maps) {
          message += `🗺️ Maps: ${selectedAddr.google_maps}\n`;
        }
      } else if (guestData) {
        if (guestData.businessName) {
          message += `🏢 Business: ${guestData.businessName}\n`;
        }
        message += `📞 CP: ${cpName} - ${cpPhone}\n`;
        message += `📍 Alamat: ${guestData.completeAddress}\n`;
        if (guestData.googleMapsLink) {
          message += `🗺️ Maps: ${guestData.googleMapsLink}\n`;
        }
      }

      message += `━━━━━━━━━━━━━━━\n\n`;
      message += `Invoice: ${invoiceNumber}\n`;
      message += `Daftar Pesanan:\n\n`;
      
      selectedItems.forEach((item, index) => {
        const itemSubtotal = item.price * item.quantity;
        if (item.type === 'bundle') {
          message += `${index + 1}. ${item.groupName} - ${item.mainProductName} + ${item.addOnProductName}\n`;
        } else {
          message += `${index + 1}. ${item.groupName} - ${item.mainProductName}\n`;
        }
        message += `Mode: ${item.modeName}\n`;
        message += `Rp ${item.price.toLocaleString('id-ID')} x ${item.quantity.toLocaleString('id-ID')} ${item.unitName || "Pcs"} = Rp ${itemSubtotal.toLocaleString('id-ID')}\n\n`;
      });
      
      message += `━━━━━━━━━━━━━━━\n`;
      message += `Subtotal: Rp ${cart.getSubtotal().toLocaleString('id-ID')}\n`;
      
      const discountAmount = calculateDiscountAmount(selectedItems, discounts);
      if (discountAmount > 0) {
        message += `Diskon (- Rp ${discountAmount.toLocaleString('id-ID')})\n`;
      }
      
      const totalPay = cart.getSubtotal() - discountAmount;
      message += `Total Pembayaran: Rp ${totalPay.toLocaleString('id-ID')}`;
      
      const info = await informationService.getInformation();
      let adminNumber = info?.phone_number ? info.phone_number.replace(/\D/g, '') : "6281234567890";
      
      if (adminNumber.startsWith('0')) {
        adminNumber = '62' + adminNumber.substring(1);
      }

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminNumber}&text=${encodedMessage}`;

      cart.clearSelectedItems();
      
      const newWindow = window.open(whatsappUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.assign(whatsappUrl);
      } else {
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

  const renderAddressSection = () => {
    if (customerLoading) {
      return <div className="p-4 text-center text-sm text-gray-500">Memuat profil...</div>;
    }

    if (!isLoggedIn) {
      return (
        <div className="p-3">
          {guestData && formMode !== 'guest' ? (
            <div className="relative px-3 py-3 border border-primary/20 bg-primary/5 rounded-md flex items-start gap-3">
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{guestData.recipientName}</span>
                </div>
                {guestData.businessName && <div className="text-xs font-medium text-gray-700 mb-0.5">{guestData.businessName}</div>}
                <div className="text-xs text-gray-600 mb-0.5">{guestData.whatsappNumber}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{guestData.completeAddress}</div>
              </div>
              <button onClick={() => setFormMode('guest')} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-2 hover:bg-primary/10 rounded-full">
                <Edit2 size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitGuest(handleSaveGuest)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input {...registerGuest("recipientName")} className={`w-full h-11 px-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none ${guestErrors.recipientName ? 'border-red-500' : 'border-gray-300'}`} placeholder="Nama Penerima *" />
                  {guestErrors.recipientName && <span className="text-[10px] text-red-500">{guestErrors.recipientName.message}</span>}
                </div>
                <div>
                  <input {...registerGuest("whatsappNumber")} className={`w-full h-11 px-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none ${guestErrors.whatsappNumber ? 'border-red-500' : 'border-gray-300'}`} placeholder="Nomor WA *" />
                  {guestErrors.whatsappNumber && <span className="text-[10px] text-red-500">{guestErrors.whatsappNumber.message}</span>}
                </div>
              </div>
              <div>
                <input {...registerGuest("businessName")} className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none" placeholder="Nama Bisnis (Opsional)" />
              </div>
              <div>
                <textarea {...registerGuest("completeAddress")} rows={3} className={`w-full p-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none min-h-24 ${guestErrors.completeAddress ? 'border-red-500' : 'border-gray-300'}`} placeholder="Alamat Lengkap *"></textarea>
                {guestErrors.completeAddress && <span className="text-[10px] text-red-500">{guestErrors.completeAddress.message}</span>}
              </div>
              <div>
                <input {...registerGuest("googleMapsLink")} className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none" placeholder="Tautan Google Maps (Opsional)" />
              </div>
              <button type="submit" className="w-full h-10 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90">
                Simpan Alamat
              </button>
            </form>
          )}
        </div>
      );
    }

    const hasBusinesses = customer?.customers && customer.customers.length > 0;
    const selectedCust = customer?.customers?.find(c => c.id === selectedCustomerId);
    const hasAddresses = selectedCust?.addresses && selectedCust.addresses.length > 0;

    return (
      <div className="p-3">
        {/* Business Selector */}
        {hasBusinesses && formMode === 'none' && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Pilih Bisnis</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {customer.customers?.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedCustomerId(c.id); setSelectedAddressId(null); }}
                  className={`border rounded-md p-3 cursor-pointer flex items-center justify-between transition-colors ${selectedCustomerId === c.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className={selectedCustomerId === c.id ? 'text-primary' : 'text-gray-400'} />
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedCustomerId === c.id ? 'border-primary' : 'border-gray-300'}`}>
                    {selectedCustomerId === c.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Selector */}
        {hasBusinesses && selectedCustomerId && formMode === 'none' && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Alamat Pengiriman
            </label>
            
            {!hasAddresses ? (
              <div className="text-center p-4 border rounded-md border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">Belum ada alamat. Hubungi admin untuk menambahkan alamat pengiriman.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedCust?.addresses?.map((addr: any) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`relative px-3 py-3 border rounded-md cursor-pointer flex items-start gap-3 transition-colors ${
                      selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary' : 'border-gray-300'}`}>
                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{addr.business_name || selectedCust.name}</span>
                        {addr.is_default && (
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold rounded">Utama</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">{addr.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial Empty State for Users with No Business */}
        {!hasBusinesses && formMode === 'none' && (
           <div className="text-center py-6">
             <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
             <h3 className="text-sm font-bold text-gray-900 mb-1">Belum ada profil bisnis</h3>
             <p className="text-xs text-gray-500">Hubungi admin untuk menambahkan bisnis dan alamat pengiriman.</p>
           </div>
        )}
      </div>
    );
  };

  const isReadyToCheckout = isLoggedIn 
    ? (selectedCustomerId !== null && selectedAddressId !== null && formMode === 'none')
    : (guestData !== null && formMode === 'none');

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
                {!isLoggedIn && (
                   <span className="text-xs text-gray-400 flex items-center gap-1"><User size={12}/> Checkout as Guest</span>
                )}
              </div>
              
              {renderAddressSection()}
            </div>

            {/* 2. ORDER ITEM SECTION */}
            <div className="bg-white border-b sm:border sm:rounded-md border-gray-200 mb-2 sm:mb-4">
               {selectedItems.map(item => {
                 const itemDiscount = itemDiscounts[item.id] || 0;
                 const itemPrice = item.price;
                 const itemDiscountedPrice = itemPrice - (itemDiscount / item.quantity);
                 const itemTotal = itemPrice * item.quantity;
                 const itemDiscountedTotal = itemTotal - itemDiscount;

                 return (
                   <div key={item.id} className="flex gap-3 px-3 py-3 border-b border-gray-50 last:border-0">
                      <button
                        type="button"
                        onClick={() => item.image && setPreviewImage({ src: item.image, alt: item.displayName })}
                        disabled={!item.image}
                        aria-label={`Perbesar gambar ${item.displayName}`}
                        className="group/image relative w-16 h-16 rounded-sm overflow-hidden shrink-0 border border-gray-100 bg-gray-50 cursor-zoom-in disabled:cursor-default"
                      >
                        {item.image && (
                          <>
                            <Image
                              src={item.image}
                              alt={item.displayName}
                              fill
                              className="object-cover transition-transform group-hover/image:scale-105"
                            />
                            <span className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white shadow-sm">
                              <ZoomIn size={12} />
                            </span>
                          </>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">{item.groupName}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.mainProductName}
                          {item.type === 'bundle' && item.addOnProductName && ` + ${item.addOnProductName}`}
                        </div>
                        <div className="mt-1 inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-primary">
                          Mode: {item.modeName}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          {itemDiscount > 0 ? (
                            <>
                              <span className="line-through text-gray-400">Rp {itemPrice.toLocaleString('id-ID')}</span>
                              <span className="font-medium text-green-600">Rp {itemDiscountedPrice.toLocaleString('id-ID')}</span>
                            </>
                          ) : (
                            <span className="font-medium text-green-600">Rp {itemPrice.toLocaleString('id-ID')}</span>
                          )}
                          <span className="text-gray-400">x {item.quantity.toLocaleString('id-ID')} {item.unitName || "Pcs"}</span>
                        </div>
                        <div className="mt-1.5">
                          {itemDiscount > 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="line-through text-gray-400">Rp {itemTotal.toLocaleString('id-ID')}</span>
                              <span className="font-semibold text-green-600">Rp {itemDiscountedTotal.toLocaleString('id-ID')}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-green-600">Rp {itemTotal.toLocaleString('id-ID')}</span>
                          )}
                        </div>
                      </div>
                   </div>
                 );
               })}
            </div>

            {/* 4. ORDER SUMMARY (Mobile) */}
            <div className="bg-white border-b sm:border sm:rounded-md border-gray-200 px-3 py-3 space-y-2 lg:hidden">
               <div className="flex justify-between">
                 <span className="text-sm text-gray-600">Subtotal untuk Produk</span>
                 <span className="text-sm font-medium text-blue-600">Rp {subtotal.toLocaleString('id-ID')}</span>
               </div>

               {discountAmount > 0 && (
                 <div className="flex justify-between">
                   <span className="text-sm text-gray-600">Diskon</span>
                   <span className="text-sm font-medium text-red-600">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                 </div>
               )}
               <div className="flex justify-between pt-2 border-t border-gray-100">
                 <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                 <span className="text-base font-bold text-green-600">Rp {totalPayment.toLocaleString('id-ID')}</span>
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
               <div className="flex justify-between pb-3 border-b border-gray-100">
                 <span className="text-sm text-gray-600">Subtotal Produk</span>
                 <span className="text-sm font-medium text-blue-600">Rp {subtotal.toLocaleString('id-ID')}</span>
               </div>

               {discountAmount > 0 && (
                 <div className="flex justify-between pb-3 border-b border-gray-100">
                   <span className="text-sm text-gray-600">Diskon Promo</span>
                   <span className="text-sm font-medium text-red-600">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                 </div>
               )}
               <div className="flex justify-between pb-3">
                 <span className="text-sm font-bold text-gray-900">Total Pembayaran</span>
                 <span className="text-base font-bold text-green-600">Rp {totalPayment.toLocaleString('id-ID')}</span>
               </div>
               <button
                  onClick={handleCheckout}
                  disabled={!isReadyToCheckout}
                  className="w-full h-11 px-6 bg-primary text-white text-[15px] font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  Checkout via WhatsApp
                </button>
             </div>
          </div>

        </div>
      </div>

      {/* 5. FIXED BOTTOM BAR (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] flex items-center justify-between gap-3 h-[60px]">
        <div className="flex flex-col items-start justify-center flex-1 min-w-0">
          <span className="text-[13px] text-gray-900">Total Pembayaran</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-green-600 leading-tight">Rp {totalPayment.toLocaleString('id-ID')}</span>
            {discountAmount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                Rp {subtotal.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={!isReadyToCheckout}
          className="h-11 px-6 bg-primary text-white text-[15px] font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-auto shrink-0"
        >
          <MessageCircle size={16} />
          Buat Pesanan
        </button>
      </div>

      {previewImage && (
        <ProductImagePreview
          image={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}

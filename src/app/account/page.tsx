"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { User, Settings as SettingsIcon, Save, LogOut, Briefcase, MapPin, Plus, X, Edit2, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import type { Address } from "@/types";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  whatsapp_number: z.string().min(8, "Nomor WhatsApp tidak valid"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  password: z.string().min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak sama",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.password, {
  message: "Password baru harus berbeda dari password saat ini",
  path: ["password"],
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const businessSchema = z.object({
  name: z.string().min(3, "Nama bisnis wajib diisi"),
  phone: z.string().optional(),
});
type BusinessFormValues = z.infer<typeof businessSchema>;

const addressSchema = z.object({
  businessName: z.string().optional(),
  address: z.string().min(10, "Harap berikan alamat lengkap"),
  googleMaps: z.string().optional(),
  isDefault: z.boolean().optional(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'password'>('profile');
  
  // Business & address form states
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const [addressFormForCustomerId, setAddressFormForCustomerId] = useState<number | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [expandedBusinessId, setExpandedBusinessId] = useState<number | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);

  const router = useRouter();
  const { customer, refreshCustomer } = useCurrentCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    setError: setPasswordFieldError,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerBusiness,
    handleSubmit: handleSubmitBusiness,
    reset: resetBusiness,
    formState: { errors: businessErrors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
  });

  const {
    register: registerAddress,
    handleSubmit: handleSubmitAddress,
    reset: resetAddress,
    setValue: setAddressValue,
    formState: { errors: addressErrors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    let isActive = true;

    const profileRequest = window.setTimeout(async () => {
      try {
        const response = await api.get("/ecommerce/auth/me");
        if (isActive && response.data.success && response.data.data) {
          reset({
            name: response.data.data.name || "",
            whatsapp_number: response.data.data.whatsapp_number || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        router.push("/login");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(profileRequest);
    };
  }, [reset, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const response = await api.put("/ecommerce/auth/profile", {
        name: data.name,
        whatsapp_number: data.whatsapp_number,
      });

      if (response.data.success) {
        alert("Profil berhasil diperbarui!");
        await refreshCustomer();
        notifyCustomerAuthChanged();
      }
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      let errorMessage = "Terjadi kesalahan saat menyimpan profil.";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.errors) {
          const details = Object.values<string[]>(error.response.data.errors).flat().join("\\n");
          errorMessage += "\\n" + details;
        }
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      const response = await api.put("/ecommerce/auth/password", {
        current_password: data.currentPassword,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });

      resetPassword();
      setPasswordMessage(response.data.message || "Password berhasil diubah.");
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (
          error as {
            response?: {
              data?: {
                message?: string;
                errors?: Record<string, string[]>;
              };
            };
          }
        ).response;
        const currentPasswordError = response?.data?.errors?.current_password?.[0];

        if (currentPasswordError) {
          setPasswordFieldError("currentPassword", {
            message: currentPasswordError,
          });
        } else {
          setPasswordError(
            response?.data?.message || "Password gagal diubah. Silakan coba kembali.",
          );
        }
      } else {
        setPasswordError("Password gagal diubah. Silakan coba kembali.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveBusiness = async (data: BusinessFormValues) => {
    try {
      await api.post('/ecommerce/auth/businesses', data);
      await refreshCustomer();
      setShowBusinessForm(false);
      resetBusiness();
    } catch {
      alert("Gagal menambahkan bisnis");
    }
  };

  const handleSaveAddress = async (data: AddressFormValues) => {
    if (!addressFormForCustomerId) return;
    try {
      if (editingAddressId) {
        await api.put(`/ecommerce/auth/addresses/${editingAddressId}`, {
          business_name: data.businessName,
          address: data.address,
          google_maps: data.googleMaps,
          is_default: data.isDefault,
        });
      } else {
        await api.post(`/ecommerce/auth/businesses/${addressFormForCustomerId}/addresses`, {
          business_name: data.businessName,
          address: data.address,
          google_maps: data.googleMaps,
          is_default: data.isDefault,
        });
      }
      await refreshCustomer();
      setAddressFormForCustomerId(null);
      setEditingAddressId(null);
      resetAddress();
    } catch {
      alert("Gagal menyimpan alamat");
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Yakin ingin menghapus alamat ini?")) return;
    setDeletingAddressId(addressId);
    try {
      await api.delete(`/ecommerce/auth/addresses/${addressId}`);
      await refreshCustomer();
    } catch {
      alert("Gagal menghapus alamat");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const openEditAddress = (addr: Address, customerId: number) => {
    setAddressFormForCustomerId(customerId);
    setEditingAddressId(Number(addr.id));
    setAddressValue("businessName", addr.business_name || "");
    setAddressValue("address", addr.address || "");
    setAddressValue("googleMaps", addr.google_maps || "");
    setAddressValue("isDefault", addr.is_default || false);
  };

  const openAddAddress = (customerId: number) => {
    setAddressFormForCustomerId(customerId);
    setEditingAddressId(null);
    resetAddress();
  };

  const cancelAddressForm = () => {
    setAddressFormForCustomerId(null);
    setEditingAddressId(null);
    resetAddress();
  };

  const handleLogout = async () => {
    try {
      await api.post("/ecommerce/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("customer_token");
      notifyCustomerAuthChanged();
      router.push("/login");
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const businesses = customer?.customers || [];

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-8">
      <div className="w-full max-w-2xl mx-auto px-4">

        {/* Tab Switcher */}
        <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={16} /> Profil
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'business'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase size={16} /> Bisnis & Alamat
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'password'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <KeyRound size={16} /> Password
          </button>
        </div>

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <SettingsIcon className="text-primary" size={24} />
              <h1 className="text-xl font-bold text-gray-900">Pengaturan Akun</h1>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User size={16} /> Nama Lengkap
                  </label>
                  <input
                    {...register("name")}
                    className={`w-full h-11 px-4 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan nama lengkap Anda"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    {...register("whatsapp_number")}
                    className={`w-full h-11 px-4 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      errors.whatsapp_number ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Contoh: 081234567890"
                  />
                  {errors.whatsapp_number && (
                    <p className="mt-1 text-xs text-red-500">{errors.whatsapp_number.message}</p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    Nomor ini akan digunakan sebagai nomor utama untuk komunikasi pesanan dan login.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-11 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={18} /> Simpan Perubahan
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full h-11 bg-white border border-red-200 text-red-600 font-medium rounded-md hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> Keluar Akun
                  </button>
                </div>
                
              </form>
            </div>
          </div>
        )}

        {/* ===== PASSWORD TAB ===== */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={24} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ubah Password</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sesi di perangkat lain akan dikeluarkan setelah password diubah.
                </p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitPassword(handleChangePassword)} className="space-y-5">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password Saat Ini
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...registerPassword("currentPassword")}
                    className={`w-full h-11 px-4 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      passwordErrors.currentPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan password saat ini"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password Baru
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword("password")}
                    className={`w-full h-11 px-4 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      passwordErrors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Minimal 8 karakter"
                  />
                  {passwordErrors.password && (
                    <p className="mt-1 text-xs text-red-500">{passwordErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    autoComplete="new-password"
                    {...registerPassword("confirmPassword")}
                    className={`w-full h-11 px-4 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      passwordErrors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Ulangi password baru"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {passwordMessage && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {passwordMessage}
                  </div>
                )}

                {passwordError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full h-11 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isChangingPassword ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <KeyRound size={18} /> Ubah Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== BUSINESS & ADDRESS TAB ===== */}
        {activeTab === 'business' && (
          <div className="space-y-4">

            {/* Business List */}
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Business Header */}
                <button
                  onClick={() => setExpandedBusinessId(expandedBusinessId === biz.id ? null : biz.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Briefcase size={16} className="text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-gray-900">{biz.name}</h3>
                      {biz.phone && <p className="text-xs text-gray-500">{biz.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{biz.addresses?.length || 0} alamat</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedBusinessId === biz.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>

                {/* Expanded: Address List */}
                {expandedBusinessId === biz.id && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-2">

                    {(!biz.addresses || biz.addresses.length === 0) && addressFormForCustomerId !== biz.id && (
                      <div className="text-center py-4">
                        <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">Belum ada alamat untuk bisnis ini.</p>
                      </div>
                    )}

                    {biz.addresses?.map((addr) => (
                      <div key={addr.id} className="relative border border-gray-200 rounded-md p-3 flex items-start gap-3 group hover:border-primary/30 transition-colors">
                        <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900">{addr.business_name || biz.name}</span>
                            {addr.is_default && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-bold rounded">Utama</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{addr.address}</p>
                          {addr.google_maps && (
                            <a href={addr.google_maps} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 inline-block">
                              Lihat di Maps
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditAddress(addr, biz.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(Number(addr.id))}
                            disabled={deletingAddressId === Number(addr.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Address Form (Add / Edit) */}
                    {addressFormForCustomerId === biz.id ? (
                      <div className="border border-primary/20 bg-primary/5 rounded-md p-3 mt-2">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-gray-900">
                            {editingAddressId ? 'Edit Alamat' : 'Tambah Alamat Baru'}
                          </h4>
                          <button onClick={cancelAddressForm} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                          </button>
                        </div>
                        <form onSubmit={handleSubmitAddress(handleSaveAddress)} className="space-y-3">
                          <div>
                            <input
                              {...registerAddress("businessName")}
                              className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none"
                              placeholder="Nama Bisnis/Cabang (Opsional)"
                            />
                          </div>
                          <div>
                            <textarea
                              {...registerAddress("address")}
                              rows={3}
                              className={`w-full p-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none min-h-24 ${addressErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="Alamat Lengkap *"
                            ></textarea>
                            {addressErrors.address && <span className="text-[10px] text-red-500">{addressErrors.address.message}</span>}
                          </div>
                          <div>
                            <input
                              {...registerAddress("googleMaps")}
                              className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none"
                              placeholder="Tautan Google Maps (Opsional)"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id={`isDefault-${biz.id}`} {...registerAddress("isDefault")} className="rounded text-primary focus:ring-primary w-4 h-4" />
                            <label htmlFor={`isDefault-${biz.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">Jadikan utama</label>
                          </div>
                          <button type="submit" className="w-full h-10 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90">
                            {editingAddressId ? 'Simpan Perubahan' : 'Simpan Alamat'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAddAddress(biz.id)}
                        className="w-full border border-dashed border-gray-300 rounded-md p-3 flex items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium"
                      >
                        <Plus size={16} /> Tambah Alamat
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Business Form */}
            {showBusinessForm ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">Tambah Bisnis Baru</h3>
                  <button onClick={() => { setShowBusinessForm(false); resetBusiness(); }} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmitBusiness(handleSaveBusiness)} className="space-y-3">
                  <div>
                    <input
                      {...registerBusiness("name")}
                      className={`w-full h-11 px-3 text-sm border rounded-md focus:ring-1 focus:ring-primary/50 outline-none ${businessErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Nama Bisnis *"
                    />
                    {businessErrors.name && <span className="text-[10px] text-red-500">{businessErrors.name.message}</span>}
                  </div>
                  <div>
                    <input
                      {...registerBusiness("phone")}
                      className="w-full h-11 px-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary/50 outline-none"
                      placeholder="Nomor Telepon (Opsional)"
                    />
                  </div>
                  <button type="submit" className="w-full h-10 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90">
                    Simpan Bisnis
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowBusinessForm(true)}
                className="w-full bg-white rounded-lg shadow-sm border border-dashed border-gray-300 p-4 flex items-center justify-center gap-2 text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors text-sm font-semibold"
              >
                <Plus size={18} /> Tambah Bisnis Baru
              </button>
            )}

            {/* Empty State */}
            {businesses.length === 0 && !showBusinessForm && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">Belum ada profil bisnis</h3>
                <p className="text-sm text-gray-500 mb-4">Tambahkan profil bisnis Anda untuk menyimpan alamat pengiriman.</p>
                <button
                  onClick={() => setShowBusinessForm(true)}
                  className="h-10 px-5 bg-primary text-white text-sm rounded-md font-medium hover:bg-primary/90 inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Buat Profil Bisnis
                </button>
              </div>
            )}

            {/* Logout (on business tab too) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-11 bg-white border border-red-200 text-red-600 font-medium rounded-md hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut size={18} /> Keluar Akun
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

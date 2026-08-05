"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { User, Settings as SettingsIcon, LogOut, Briefcase, MapPin, KeyRound, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import { clearCustomerSession } from "@/lib/customer-session";

type ProfileFormValues = {
  name: string;
  whatsapp_number: string;
};

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

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'password'>('profile');
  
  const [expandedBusinessId, setExpandedBusinessId] = useState<number | null>(null);

  const router = useRouter();
  const { customer } = useCurrentCustomer();

  const {
    register,
    reset,
  } = useForm<ProfileFormValues>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    setError: setPasswordFieldError,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
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

  const handleLogout = async () => {
    try {
      await api.post("/ecommerce/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearCustomerSession();
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
              <div className="space-y-5">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User size={16} /> Nama Lengkap
                  </label>
                  <input
                    {...register("name")}
                    disabled
                    className="w-full h-11 px-4 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                    placeholder="Masukkan nama lengkap Anda"
                  />

                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    {...register("whatsapp_number")}
                    disabled
                    className="w-full h-11 px-4 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                    placeholder="Contoh: 081234567890"
                  />

                  <p className="mt-1.5 text-xs text-gray-500">
                    Nomor ini akan digunakan sebagai nomor utama untuk komunikasi pesanan dan login.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                    Nama lengkap dan nomor WhatsApp hanya dapat dilihat. Hubungi admin untuk melakukan perubahan.
                  </p>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full h-11 bg-white border border-red-200 text-red-600 font-medium rounded-md hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={18} /> Keluar Akun
                  </button>
                </div>
                
              </div>
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

                    <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      Alamat hanya dapat dilihat. Hubungi admin untuk melakukan perubahan.
                    </p>

                    {(!biz.addresses || biz.addresses.length === 0) && (
                      <div className="text-center py-4">
                        <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-3">Belum ada alamat untuk bisnis ini.</p>
                      </div>
                    )}

                    {biz.addresses?.map((addr) => (
                      <div key={addr.id} className="relative border border-gray-200 rounded-md p-3 flex items-start gap-3">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Empty State */}
            {businesses.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
                <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-900 mb-1">Belum ada profil bisnis</h3>
                <p className="text-sm text-gray-500">Hubungi admin untuk menambahkan bisnis dan alamat.</p>
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

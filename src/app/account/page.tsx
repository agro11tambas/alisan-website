"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Settings as SettingsIcon, Save, LogOut } from "lucide-react";
import { api } from "@/services/api";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  whatsapp_number: z.string().min(8, "Nomor WhatsApp tidak valid"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    setIsMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/ecommerce/auth/me");
      if (response.data.success && response.data.data) {
        reset({
          name: response.data.data.name || "",
          whatsapp_number: response.data.data.whatsapp_number || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // If not logged in, redirect to login
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const response = await api.put("/ecommerce/auth/profile", {
        name: data.name,
        whatsapp_number: data.whatsapp_number,
      });

      if (response.data.success) {
        alert("Profil berhasil diperbarui!");
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      let errorMessage = "Terjadi kesalahan saat menyimpan profil.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.errors) {
          const details = Object.values(error.response.data.errors).flat().join("\\n");
          errorMessage += "\\n" + details;
        }
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/ecommerce/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("customer_token");
      // Optional: if using a global store like Zustand, clear it here too
      // useCurrentCustomer.getState().logout();
      router.push("/login");
      router.refresh();
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="w-full max-w-xl mx-auto px-4">
        
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
        
      </div>
    </div>
  );
}

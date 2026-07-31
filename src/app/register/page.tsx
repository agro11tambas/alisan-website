"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { informationService } from "@/services/informationService";

const DEFAULT_ADMIN_NUMBER = "6281234567890";

export default function RegisterPage() {
  const [adminNumber, setAdminNumber] = useState(DEFAULT_ADMIN_NUMBER);

  useEffect(() => {
    informationService.getInformation().then((info) => {
      if (!info?.phone_number) return;

      let phoneNumber = info.phone_number.replace(/\D/g, "");
      if (phoneNumber.startsWith("0")) {
        phoneNumber = `62${phoneNumber.slice(1)}`;
      }

      setAdminNumber(phoneNumber);
    });
  }, []);

  const message = encodeURIComponent(
    "Halo Admin Alisan, saya ingin mendaftar akun.",
  );
  const whatsappUrl = `https://wa.me/${adminNumber}?text=${message}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="p-6 text-center md:p-8">
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
              <MessageCircle size={30} aria-hidden="true" />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Daftar Akun
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Untuk melakukan pendaftaran akun, silakan hubungi admin Alisan
            melalui WhatsApp.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
          >
            <MessageCircle size={19} aria-hidden="true" />
            Hubungi Admin via WhatsApp
          </a>

          <div className="mt-6 text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * Form pendaftaran lama dinonaktifkan sementara.
 * Kode dipertahankan agar dapat diaktifkan kembali bila diperlukan.
 *
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/validations";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    console.log("Register data:", data);
    await new Promise(r => setTimeout(r, 1000));
    alert("This is a UI-only authentication page. The backend logic will be integrated later.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-2 md:py-8 md:px-4">
      <div className="w-full max-w-md bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-2 md:p-6">
          <div className="text-center mb-2 md:mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Buat Akun</h2>
            <p className="text-sm text-gray-500 mt-2">Bergabunglah dengan Alisan dan mulai belanja hari ini.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5 md:space-y-4">
            <div className="space-y-0.5 md:space-y-1">
              <label className="text-[10px] md:text-xs font-medium text-gray-700">Nama Lengkap</label>
              <div className="relative">
                <input
                  {...register("fullName")}
                  className={`w-full h-8 md:h-10 pl-3 md:pl-4 pr-3 md:pr-4 text-xs md:text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`} placeholder="John Doe"
                />
                {errors.fullName && <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName.message}</p>}
              </div>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <label className="text-[10px] md:text-xs font-medium text-gray-700">Alamat Email</label>
              <div className="relative">
                <input
                  {...register("email")}
                  className={`w-full h-8 md:h-10 pl-3 md:pl-4 pr-3 md:pr-4 text-xs md:text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`} placeholder="john@example.com"
                />
                {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <label className="text-[10px] md:text-xs font-medium text-gray-700">Nomor WhatsApp</label>
              <div className="relative">
                <input
                  {...register("whatsappNumber")}
                  className={`w-full h-8 md:h-10 pl-3 md:pl-4 pr-3 md:pr-4 text-xs md:text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                    errors.whatsappNumber ? 'border-red-500' : 'border-gray-300'
                  }`} placeholder="081234567890"
                />
                {errors.whatsappNumber && <p className="text-[10px] text-red-500 mt-0.5">{errors.whatsappNumber.message}</p>}
              </div>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <label className="text-[10px] md:text-xs font-medium text-gray-700">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full h-8 md:h-10 pl-3 md:pl-4 pr-10 text-xs md:text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`} placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password.message}</p>}
            </div>

            <div className="space-y-0.5 md:space-y-1">
              <label className="text-[10px] md:text-xs font-medium text-gray-700">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  className={`w-full h-8 md:h-10 pl-3 md:pl-4 pr-10 text-xs md:text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`} placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-0.5">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-8 md:h-10 bg-primary text-white text-xs md:text-sm font-bold rounded hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center mt-2"
            >
              {isSubmitting ? "Membuat akun..." : "Buat Akun"}
            </button>

          </form>

          <div className="mt-2 md:mt-6 text-center text-[10px] md:text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
*/

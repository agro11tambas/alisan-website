"use client";

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

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Atau</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                window.location.href = `${baseURL}/ecommerce/auth/google/redirect`;
              }}
              className="w-full h-8 md:h-10 bg-white border border-gray-300 text-gray-700 text-xs md:text-sm font-bold rounded hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Daftar dengan Google
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

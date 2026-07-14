"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginPhoneSchema, LoginPhoneFormValues, loginOtpSchema, LoginOtpFormValues } from "@/validations";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: errorsPhone, isSubmitting: isSubmittingPhone },
  } = useForm<LoginPhoneFormValues>({
    resolver: zodResolver(loginPhoneSchema),
  });

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp, isSubmitting: isSubmittingOtp },
  } = useForm<LoginOtpFormValues>({
    resolver: zodResolver(loginOtpSchema),
  });

  const onPhoneSubmit = async (data: LoginPhoneFormValues) => {
    setServerError("");
    setLoading(true);
    try {
      // Simulate API call to send OTP to WhatsApp
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPhoneNumber(data.phoneNumber);
      setStep(2);
    } catch (error) {
      setServerError("Gagal mengirim OTP. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data: LoginOtpFormValues) => {
    setServerError("");
    setLoading(true);
    try {
      // Simulate API call to verify OTP and login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Simulate setting token
      localStorage.setItem("customer_token", "mock_otp_token");
      
      alert(`Berhasil login dengan nomor ${phoneNumber}`);
      router.push("/");
    } catch (error) {
      setServerError("OTP tidak valid. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-2 md:py-8 md:px-4">
      <div className="w-full max-w-md bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        {step === 2 && (
          <button 
            onClick={() => setStep(1)}
            className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="p-2 md:p-6 pt-10 md:pt-10">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl tracking-tighter mx-auto mb-3 md:mb-4 shadow-lg shadow-primary/30">
              A
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {step === 1 ? "Selamat Datang Kembali" : "Verifikasi OTP"}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {step === 1 
                ? "Masukkan nomor WhatsApp Anda untuk masuk." 
                : `Masukkan 6 digit kode OTP yang dikirim ke WA ${phoneNumber}`}
            </p>
          </div>

          {/* Form Step 1: Phone Number */}
          {step === 1 && (
            <form onSubmit={handleSubmitPhone(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nomor WhatsApp</label>
                <div className="relative">
                  <input
                    type="tel"
                    {...registerPhone("phoneNumber")}
                    className={`w-full h-10 pl-4 pr-4 text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                      errorsPhone.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`} placeholder="Contoh: 08123456789"
                  />
                  {errorsPhone.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errorsPhone.phoneNumber.message}</p>}
                </div>
              </div>

              {serverError && (
                <p className="text-xs text-red-500 text-center">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmittingPhone || loading}
                className="w-full h-10 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center mt-2"
              >
                {isSubmittingPhone || loading ? "Mengirim OTP..." : "Kirim OTP ke WA"}
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
                className="w-full h-10 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Masuk dengan Google
              </button>
              
            </form>
          )}

          {/* Form Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Kode OTP</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    {...registerOtp("otp")}
                    className={`w-full h-10 pl-4 pr-4 text-center tracking-[0.5em] text-lg font-bold border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                      errorsOtp.otp ? 'border-red-500' : 'border-gray-300'
                    }`} placeholder="••••••"
                  />
                  {errorsOtp.otp && <p className="text-[10px] text-red-500 mt-1">{errorsOtp.otp.message}</p>}
                </div>
              </div>

              {serverError && (
                <p className="text-xs text-red-500 text-center">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmittingOtp || loading}
                className="w-full h-10 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center mt-2"
              >
                {isSubmittingOtp || loading ? "Memverifikasi..." : "Verifikasi & Login"}
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}

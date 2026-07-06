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
              {step === 1 ? "Welcome back" : "Verifikasi OTP"}
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

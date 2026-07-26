"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginPhoneSchema, LoginPhoneFormValues } from "@/validations";
import { useCustomerLogin } from "@/hooks/use-customer-auth";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useCustomerLogin();
  const { isLoggedIn, loading: isCheckingAuth } = useCurrentCustomer();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hasSensitiveCredentials =
      currentUrl.searchParams.has("phoneNumber") ||
      currentUrl.searchParams.has("password");

    if (!hasSensitiveCredentials) {
      return;
    }

    const requestedRedirect = currentUrl.searchParams.get("redirect");
    const safeRedirect =
      requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : null;
    const cleanUrl = safeRedirect
      ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
      : "/login";

    window.history.replaceState(window.history.state, "", cleanUrl);
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && isLoggedIn) {
      router.replace("/");
    }
  }, [isCheckingAuth, isLoggedIn, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPhoneFormValues>({
    resolver: zodResolver(loginPhoneSchema),
  });

  const onSubmit = async (data: LoginPhoneFormValues) => {
    setServerError("");

    try {
      await login({
        whatsapp_number: data.phoneNumber,
        password: data.password,
      });

      const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");
      const redirectUrl =
        requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
          ? requestedRedirect
          : "/";

      router.replace(redirectUrl);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;

      setServerError(message || "Nomor HP atau password salah.");
    }
  };

  if (isCheckingAuth || isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 px-2 md:py-8 md:px-4">
      <div className="w-full max-w-md bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-2 md:p-6 pt-10 md:pt-10">
          {/* Header */}
          <div className="text-center mb-4 md:mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl tracking-tighter mx-auto mb-3 md:mb-4 shadow-lg shadow-primary/30">
              A
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="text-sm text-gray-500 mt-2">
              Masukkan nomor HP dan password Anda untuk masuk.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="phoneNumber" className="text-xs font-medium text-gray-700">Nomor HP</label>
                <div className="relative">
                  <input
                    id="phoneNumber"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    {...register("phoneNumber")}
                    className={`w-full h-10 pl-4 pr-4 text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`} placeholder="Contoh: 08123456789"
                  />
                  {errors.phoneNumber && <p className="text-[10px] text-red-500 mt-1">{errors.phoneNumber.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-medium text-gray-700">Password</label>
                  <span className="text-[10px] text-gray-400">
                    Link reset dibuat melalui admin
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className={`w-full h-10 pl-4 pr-11 text-sm border rounded focus:ring-1 focus:ring-primary/50 outline-none transition-all ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Masukkan password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              {serverError && (
                <p className="text-xs text-red-500 text-center">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full h-10 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center mt-2"
              >
                {isSubmitting || loading ? "Memproses..." : "Masuk"}
              </button>

            </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-primary hover:underline">
              Daftar
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, XCircle } from "lucide-react";

import api from "@/services/api";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import {
  resetPasswordSchema,
  ResetPasswordFormValues,
} from "@/validations";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!token) {
        setServerError("Link reset password tidak lengkap.");
        setIsValidating(false);
        return;
      }

      try {
        await api.get("/ecommerce/auth/password-reset/validate", {
          params: { token },
        });

        if (isMounted) {
          setIsTokenValid(true);
        }
      } catch (error: unknown) {
        if (isMounted) {
          const message = axios.isAxiosError(error)
            ? error.response?.data?.message
            : null;
          setServerError(
            message ||
              "Link reset password tidak valid atau sudah kedaluwarsa.",
          );
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    void validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setServerError("");

    try {
      await api.post("/ecommerce/auth/password-reset", {
        token,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });
      localStorage.removeItem("customer_token");
      notifyCustomerAuthChanged();
      setIsSuccess(true);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null;
      setServerError(
        message || "Password gagal diubah. Silakan coba kembali.",
      );
    }
  };

  if (isValidating) {
    return (
      <div className="py-12 text-center">
        <LoaderCircle className="mx-auto mb-3 animate-spin text-primary" size={34} />
        <p className="text-sm text-gray-500">Memeriksa link reset password...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-green-500" size={48} />
        <h2 className="text-2xl font-bold text-gray-900">Password Berhasil Diubah</h2>
        <p className="mt-2 text-sm text-gray-500">
          Silakan login kembali menggunakan password baru Anda.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="py-8 text-center">
        <XCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-bold text-gray-900">Link Tidak Berlaku</h2>
        <p className="mt-2 text-sm text-gray-500">{serverError}</p>
        <p className="mt-3 text-xs text-gray-400">
          Hubungi admin untuk membuat link reset password yang baru.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded border border-gray-300 px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold tracking-tighter text-white shadow-lg shadow-primary/30">
          A
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Buat Password Baru
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Gunakan minimal 8 karakter untuk password baru Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium text-gray-700">
            Password Baru
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={`h-10 w-full rounded border pl-4 pr-11 text-sm outline-none transition-all focus:ring-1 focus:ring-primary/50 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Minimal 8 karakter"
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
          {errors.password && (
            <p className="mt-1 text-[10px] text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`h-10 w-full rounded border pl-4 pr-11 text-sm outline-none transition-all focus:ring-1 focus:ring-primary/50 ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ulangi password baru"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((visible) => !visible)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-600"
              aria-label={showConfirmation ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-center text-xs text-red-500">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-10 w-full items-center justify-center rounded bg-primary text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
        </button>
      </form>
    </>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="py-12 text-center">
      <LoaderCircle className="mx-auto mb-3 animate-spin text-primary" size={34} />
      <p className="text-sm text-gray-500">Memuat halaman...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2 py-8 md:px-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm md:rounded-xl">
        <div className="p-5 md:p-8">
          <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

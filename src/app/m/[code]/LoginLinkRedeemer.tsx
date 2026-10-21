"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoaderCircle, XCircle } from "lucide-react";

import api from "@/services/api";
import { LoginResponse } from "@/types/auth-type";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import {
  clearCustomerSession,
  saveCustomerSession,
} from "@/lib/customer-session";

/**
 * Tujuan setelah login diambil dari `?redirect=`. Hanya path internal yang
 * diterima: `//host-lain` juga lolos cek "diawali /", jadi ikut ditolak supaya
 * link login tidak bisa dipakai memantulkan pengunjung ke domain orang lain.
 */
function readSafeRedirect(): string {
  const requested = new URLSearchParams(window.location.search).get("redirect");

  return requested?.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/";
}

export default function LoginLinkRedeemer({ code }: { code: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  // ERP menandai kode terpakai begitu endpoint ini dijawab. StrictMode
  // menjalankan effect dua kali di dev, dan panggilan kedua akan menolak kode
  // yang baru saja berhasil dipakai — penjaga ini yang mencegahnya.
  const hasRedeemed = useRef(false);

  useEffect(() => {
    if (hasRedeemed.current) return;
    hasRedeemed.current = true;

    async function redeem() {
      try {
        const response = await api.post<LoginResponse>(
          "/ecommerce/auth/login-link/redeem",
          { code },
          // Kode adalah satu-satunya kredensial di sini. Kalau browser masih
          // menyimpan token lama — milik customer lain, atau yang sudah
          // kedaluwarsa — token itu tidak boleh ikut dan membuat ERP menolak
          // permintaan sebelum kodenya dibaca.
          { headers: { Authorization: null } },
        );

        const { token, customer, user } = response.data.data;

        // Dibersihkan dulu supaya profil customer sebelumnya tidak tertinggal
        // di cache kalau respons kali ini tidak menyertakan data customer.
        clearCustomerSession();
        saveCustomerSession(token, customer ?? user);
        notifyCustomerAuthChanged();

        // `replace`, bukan `push`: entri /m/<kode> dibuang dari riwayat browser
        // supaya kodenya tidak tertinggal di tombol Back maupun terkirim
        // sebagai Referer ke halaman berikutnya.
        router.replace(readSafeRedirect());
      } catch (error: unknown) {
        // Hanya 422 yang berarti "ERP sengaja menolak kode ini" dan pesannya
        // sudah ditulis untuk customer. Status lain bisa datang dari lapisan
        // framework — route salah, 500, rate limit — dan pesannya teknis serta
        // berbahasa Inggris, jadi tidak pantas ditampilkan apa adanya.
        const deliberateRejection =
          axios.isAxiosError(error) && error.response?.status === 422
            ? error.response?.data?.message
            : null;

        setErrorMessage(
          deliberateRejection ||
            "Link login tidak berlaku atau sudah kedaluwarsa.",
        );
      }
    }

    void redeem();
  }, [code, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-2 py-8 md:px-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm md:rounded-xl">
        <div className="p-5 md:p-8">
          {errorMessage ? (
            <div className="py-8 text-center">
              <XCircle className="mx-auto mb-4 text-red-500" size={48} />
              <h2 className="text-2xl font-bold text-gray-900">
                Link Tidak Berlaku
              </h2>
              <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
              <p className="mt-3 text-xs text-gray-400">
                Hubungi admin Alisan untuk minta link login yang baru, atau
                masuk memakai nomor WhatsApp dan password Anda.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-10 items-center justify-center rounded bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                Ke Halaman Login
              </Link>
            </div>
          ) : (
            <div className="py-12 text-center">
              <LoaderCircle
                className="mx-auto mb-3 animate-spin text-primary"
                size={34}
              />
              <p className="text-sm text-gray-500">
                Sedang memasukkan Anda ke akun...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

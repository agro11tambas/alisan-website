'use client';

// Tanpa berkas ini, satu kegagalan render server — ERP lambat, timeout, 500 —
// membuat Next menampilkan layar hitam bawaan "This page couldn't load" tanpa
// header, tanpa jalan kembali, dan tanpa cara mencoba lagi selain reload manual.
// Boundary ini menggantinya dengan halaman yang masih memakai layout situs dan
// menawarkan percobaan ulang di tempat.

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Digest-nya sama dengan yang dicetak server, jadi keluhan pengunjung bisa
    // dicocokkan dengan barisnya di log Hostinger.
    console.error('[page-error]', error.digest ?? '-', error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle size={32} />
        </div>

        <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          Halaman gagal dimuat
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500 md:text-base">
          Koneksi ke server data sedang bermasalah. Ini biasanya sementara —
          silakan coba lagi.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-8 font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex h-12 w-full items-center justify-center rounded-md border border-gray-200 bg-white px-8 font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
          >
            Kembali ke Beranda
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-[10px] uppercase tracking-wider text-gray-400">
            Kode: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

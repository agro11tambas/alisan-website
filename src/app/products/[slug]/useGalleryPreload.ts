"use client";

import { useEffect } from "react";
import { getImageProps } from "next/image";

// Satu URL cuma perlu dihangatkan sekali per sesi browser. Set ini sengaja di
// level modul supaya pindah varian bolak-balik tidak menjadwalkan unduhan ulang.
const warmed = new Set<string>();

// Membangkitkan turunan pertama sebuah foto itu mahal di sisi server (unduh PNG
// ~1,5 MB dari ERP lalu encode WebP), jadi antreannya dibatasi dua-dua supaya
// tidak menabrak permintaan halaman yang sedang dipakai user.
const CONCURRENCY = 2;

type IdleHandle = { type: "idle" | "timeout"; id: number };

function requestIdle(callback: () => void): IdleHandle {
  if (typeof window.requestIdleCallback === "function") {
    return { type: "idle", id: window.requestIdleCallback(callback, { timeout: 2000 }) };
  }
  return { type: "timeout", id: window.setTimeout(callback, 300) };
}

function cancelIdle(handle: IdleHandle) {
  if (handle.type === "idle" && typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle.id);
    return;
  }
  window.clearTimeout(handle.id);
}

// `sizes` dan srcset-nya harus persis sama dengan yang dirender <Image>, kalau
// beda satu kandidat saja browser akan mengunduh ulang dan pemanasan ini sia-sia.
function warmOne(src: string, sizes: string) {
  return new Promise<void>((resolve) => {
    let props;
    try {
      props = getImageProps({ src, alt: "", fill: true, sizes }).props;
    } catch {
      // src di luar remotePatterns; biarkan <Image> yang melaporkan errornya.
      resolve();
      return;
    }

    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    if (props.sizes) image.sizes = props.sizes;
    if (props.srcSet) image.srcset = props.srcSet;
    image.src = props.src;
  });
}

/**
 * Foto kombinasi cup + tutup datang dari ERP sebagai PNG 1254x1254 (~1,5 MB) dan
 * tiap pasangan punya URL sendiri. Kalau baru diminta pada saat user mengklik
 * tutupnya, `/_next/image` harus mengunduh sumbernya lalu mengubahnya ke WebP
 * lebih dulu — dan karena slide Embla cuma berganti `src`, gambar lama tetap
 * terpampang sampai yang baru selesai di-decode. Itulah jeda yang terlihat.
 *
 * Seluruh kandidatnya sudah diketahui sejak render pertama, jadi cache-nya
 * dihangatkan saat browser idle. Begitu user memilih, gambarnya tinggal diambil
 * dari cache dan langsung tampil.
 */
export function useGalleryPreload(images: string[], sizes: string) {
  // Array-nya dibangun ulang tiap render di pemanggil, jadi efeknya dikunci ke
  // isi daftar, bukan identitas array.
  const key = images.join("|");

  useEffect(() => {
    const queue = key.split("|").filter((src) => src && !warmed.has(src));
    if (queue.length === 0) return;

    let cancelled = false;
    let cursor = 0;

    const next = async (): Promise<void> => {
      while (!cancelled) {
        const src = queue[cursor++];
        if (!src) return;
        if (warmed.has(src)) continue;
        warmed.add(src);
        await warmOne(src, sizes);
      }
    };

    const handle = requestIdle(() => {
      for (let worker = 0; worker < CONCURRENCY; worker += 1) void next();
    });

    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, [key, sizes]);
}

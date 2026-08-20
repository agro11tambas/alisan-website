import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Foto produk dari ERP diunggah sebagai PNG 1254x1254 (~1,5 MB). Optimasi
    // mengecilkannya ke ukuran tampil sebenarnya dan mengubahnya ke WebP, jadi
    // `unoptimized` tidak boleh dinyalakan lagi.
    formats: ["image/webp"],
    // ERP lokal (alisan_code.test / Laragon) memetakan ke 127.0.0.1, dan sejak
    // Next 16 optimizer menolak host yang resolve ke IP privat. Hanya dibuka di
    // dev; di produksi gambar datang dari erpalisan.com yang publik.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    qualities: [75],
    minimumCacheTTL: 2678400, // 31 hari; gambar produk jarang berubah
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'erpalisan.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'erpalisan.com',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'alisan_code.test',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'alisan_code.test',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;

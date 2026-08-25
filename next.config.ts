import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Untuk halaman statis Next mengirim `Cache-Control: s-maxage=31536000`, dan
  // CDN Hostinger (hcdn) menghormatinya: HTML halaman ikut disimpan di edge
  // selama satu tahun. Begitu build baru dideploy nama chunk JS/CSS berubah
  // sementara edge masih melayani HTML lama, jadi pengunjung menerima halaman
  // yang seluruh chunk-nya 404 — tampil tanpa CSS dan tanpa interaksi (kasus
  // /cart). Efek sampingnya `revalidatePath` dari ERP juga tidak pernah sampai
  // ke pengunjung. TTL edge dipendekkan supaya HTML selalu ditanyakan ulang ke
  // origin; aset /_next/static tetap immutable satu tahun karena header itu
  // diatur Next sendiri dan memang tidak bisa ditimpa dari sini.
  async headers() {
    const pageCacheControl = [
      {
        key: "Cache-Control",
        value: "public, max-age=0, s-maxage=60, must-revalidate",
      },
    ];

    // Halaman yang dirender per-permintaan (`/login`, katalog yang membaca
    // query pencarian) tetap tidak boleh menginap di edge: aturan terakhir yang
    // cocok yang dipakai, jadi keduanya dikembalikan ke no-store.
    const noStore = [
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    ];

    return [
      { source: "/", headers: pageCacheControl },
      { source: "/:path((?!_next/|api/).*)", headers: pageCacheControl },
      { source: "/login", headers: noStore },
      { source: "/products", headers: noStore },
      { source: "/products/:slug*", headers: noStore },
    ];
  },
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

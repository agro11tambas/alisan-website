import Image from "next/image";
import Link from "next/link";
import { productService } from "@/services/productService";
import FeaturedProductCarousel from "@/components/product/FeaturedProductCarousel";
import BuyAgainSection from "@/components/product/BuyAgainSection";

// Katalog jarang berubah, jadi halaman ini di-render ulang paling sering tiap 5
// menit alih-alih tiap kunjungan. Perubahan dari ERP tidak perlu menunggu selama
// itu: ERP memanggil /api/revalidate begitu produk/category disimpan.
export const revalidate = 300;

export default async function Home() {
  const [groups, catalogIndex] = await Promise.all([
    productService.getProductGroups({ limit: 5 }),
    productService.getCatalogIndex(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Area */}
      <section className="bg-white pt-1 pb-1.5 md:pt-2 md:pb-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="relative overflow-hidden rounded-lg border border-gray-100 shadow-sm aspect-[1672/941] md:rounded-2xl">
            <Image
              src="/images/banner-true.webp"
              alt="Banner promosi Alisan"
              fill
              className="object-cover"
              sizes="(max-width: 640px) calc(100vw - 1rem), (max-width: 1280px) calc(100vw - 2rem), 1280px"
              priority
            />
          </div>
        </div>
      </section>

      {/* Beli Lagi */}
      <BuyAgainSection catalog={catalogIndex} />

      {/* Featured Products */}
      <section className="border-t border-border bg-gray-50/50 py-1.5 md:py-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 md:mb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900 md:mb-1 md:text-2xl">
                Featured Product
              </h2>
              <p className="hidden text-sm text-gray-500 md:block">
                Pilihan produk unggulan untuk kebutuhan bisnis Anda
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-green-600 px-3 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:scale-95 md:h-10 md:px-5 md:text-sm"
            >
              Lihat Semua Produk
            </Link>
          </div>

          <FeaturedProductCarousel groups={groups} />
        </div>
      </section>
    </div>
  );
}

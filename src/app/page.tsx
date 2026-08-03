import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import FeaturedProductCarousel from "@/components/product/FeaturedProductCarousel";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, groups] = await Promise.all([
    categoryService.getCategories(),
    productService.getProductGroups({ limit: 5 }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Area */}
      <section className="bg-white pt-1 pb-1.5 md:pt-2 md:pb-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="relative overflow-hidden rounded-lg border border-gray-100 shadow-sm aspect-[1672/941] md:rounded-2xl">
            <Image
              src="/images/banner-true.png"
              alt="Banner promosi Alisan"
              fill
              className="object-cover"
              sizes="(max-width: 640px) calc(100vw - 1rem), (max-width: 1280px) calc(100vw - 2rem), 1280px"
              priority
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-5 md:py-10">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary md:text-xs">
                Jelajahi koleksi
              </p>
              <h2 className="text-xl font-bold tracking-tight text-gray-950 md:text-3xl">
                Kategori Produk
              </h2>
            </div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-gray-500 md:block">
              Temukan kebutuhan bisnis Anda berdasarkan jenis produk.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative flex min-h-24 flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:min-h-32 md:rounded-2xl md:p-5"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[10px] font-semibold tracking-widest text-gray-400 transition-colors group-hover:text-white/60 md:text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-7 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-300 group-hover:rotate-45 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white md:size-8">
                    <ArrowUpRight className="size-3.5 md:size-4" aria-hidden="true" />
                  </span>
                </div>

                <span className="max-w-[12rem] text-sm font-bold leading-tight text-gray-900 transition-colors group-hover:text-white md:text-base">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-1.5 md:py-6 bg-gray-50/50 border-t border-border">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="flex items-center justify-between mb-1.5 md:mb-5">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 md:mb-1 tracking-tight">
                Featured Product
              </h2>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                Pilihan produk unggulan untuk kebutuhan bisnis Anda
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex h-8 items-center justify-center rounded-full bg-green-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:scale-95 md:h-10 md:px-5 md:text-sm"
            >
              Lihat Semua
            </Link>
          </div>

          <FeaturedProductCarousel groups={groups} />
        </div>
      </section>
    </div>
  );
}

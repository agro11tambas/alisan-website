import Image from "next/image";
import Link from "next/link";
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
      <section className="bg-white py-1.5 md:py-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 md:mb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900 md:mb-1 md:text-2xl">
                Kategori Produk
              </h2>
              <p className="hidden text-sm text-gray-500 md:block">
                Pilih kategori sesuai kebutuhan Anda
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-green-600 px-3 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:scale-95 md:h-10 md:px-5 md:text-sm"
            >
              Lihat Semua Kategori
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-10 md:rounded-xl">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex min-h-20 flex-col items-center justify-center gap-1.5 bg-white px-1 py-2 text-center transition-colors hover:bg-blue-50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:min-h-28 md:gap-2.5 md:px-2 md:py-3"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-full bg-blue-50 text-xs font-bold uppercase text-primary transition-colors group-hover:bg-primary group-hover:text-white md:size-12 md:text-base"
                >
                  {category.name.trim().charAt(0)}
                </span>
                <span className="line-clamp-2 text-[10px] font-medium leading-tight text-gray-700 transition-colors group-hover:text-primary md:text-xs">
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
              Lihat Semua Produk
            </Link>
          </div>

          <FeaturedProductCarousel groups={groups} />
        </div>
      </section>
    </div>
  );
}

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
      <section className="py-1.5 md:py-6 bg-white">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="flex items-center justify-between mb-1.5 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              Kategori Produk
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-10 gap-1 md:gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group flex flex-col items-center gap-1 md:gap-3"
              >
                <div className="relative w-10 h-10 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-50 shadow-sm border border-gray-100 group-hover:border-primary transition-colors">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <span className="text-xs md:text-sm font-medium text-center text-gray-700 group-hover:text-primary transition-colors">
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

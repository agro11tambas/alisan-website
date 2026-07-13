import Image from "next/image";
import Link from "next/link";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import ProductCard from "@/components/product/ProductCard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, groups] = await Promise.all([
    categoryService.getCategories(),
    productService.getProductGroups({ limit: 10 }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner Area */}
      <section className="bg-white pt-1 pb-1.5 md:pt-2 md:pb-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="relative rounded-lg md:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] bg-gray-900 shadow-sm border border-gray-100">
            <Image
              src="/images/home-banner.png"
              alt="Promo Banner"
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              priority
            />
            <div className="absolute inset-0 flex items-center">
              <div className="px-4 md:px-12 max-w-2xl text-white">
                <span className="inline-block py-0.5 px-2 md:py-1 md:px-3 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground text-[10px] md:text-xs font-bold mb-2 md:mb-4 shadow-sm">
                  SABLON CUP PREMIUM
                </span>
                <h1 className="text-xl sm:text-3xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight drop-shadow-md leading-tight">
                  Tingkatkan Nilai Brand Minuman Anda bersama Alisan
                </h1>
                <p className="text-xs sm:text-sm md:text-lg mb-4 md:mb-6 text-gray-200 drop-shadow max-w-[90%]">
                  Kami menyediakan jasa sablon cup plastik berkualitas tinggi dengan hasil tajam dan awet. Solusi terbaik untuk kemasan bisnis minuman kekinian Anda.
                </p>
                <Link
                  href="/products"
                  className="inline-flex h-8 px-4 text-xs md:h-12 md:px-6 md:text-sm items-center justify-center rounded-md bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  Lihat Produk
                </Link>
              </div>
            </div>
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
                Produk Terlaris
              </h2>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                Pilihan cup sablon paling diminati oleh pelanggan kami
              </p>
            </div>
            <Link
              href="/products"
              className="text-[10px] md:text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-6">
            {groups.map((group) => (
              <ProductCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

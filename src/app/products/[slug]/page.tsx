import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import ProductMobileHeader from "./ProductMobileHeader";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const group = await productService.getProductGroupBySlug(resolvedParams.slug);
  
  if (!group) {
    notFound();
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-24 md:pb-8">
      <ProductMobileHeader />
      
      <div className="hidden md:block bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-[10px] md:text-sm text-gray-500 gap-1.5 md:gap-2">
            <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary transition-colors">Produk</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate">{group.name}</span>
          </div>
        </div>
      </div>

      <div className="w-full sm:container sm:mx-auto sm:px-4 pt-12 md:pt-0 mt-0 md:mt-3">
        <div className="md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 md:p-6">
          <ProductDetailClient group={group} />
        </div>

        {group.description?.trim() && (
          <div className="mt-1.5 bg-white px-3 py-4 sm:mt-4 sm:rounded-xl sm:border sm:border-gray-100 sm:p-6 sm:shadow-sm">
            <h2 className="mb-3 text-lg font-bold tracking-tight text-gray-900">
              Deskripsi Produk
            </h2>
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
              {group.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

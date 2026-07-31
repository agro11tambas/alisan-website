import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import ProductMobileHeader from "./ProductMobileHeader";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const [group, groups] = await Promise.all([
    productService.getProductGroupBySlug(resolvedParams.slug),
    productService.getProductGroups(),
  ]);
  
  if (!group) {
    notFound();
  }

  const relatedGroups = await productService.getRelatedProductGroups(group.id, 5, groups);

  return (
    <div className="bg-gray-100 min-h-screen pb-8">
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

        {/* Related Products */}
        {relatedGroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Mungkin Anda Suka</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {relatedGroups.map(rg => (
                <ProductCard key={rg.id} group={rg} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

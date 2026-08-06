import { productService } from "@/services/productService";
import {
  categoryService,
  collectCategoryIds,
  getCategoryAncestors,
} from "@/services/categoryService";
import ProductCard from "@/components/product/ProductCard";
import CategoryChips from "@/components/category/CategoryChips";
import CategorySidebar from "@/components/category/CategorySidebar";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const categorySlug = typeof params.category === 'string' ? params.category : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const [categories, unfilteredGroups] = await Promise.all([
    categoryService.getCategories(),
    productService.getProductGroups({ search }),
  ]);
  const rootCategories = categories.filter(c => !c.parentId);
  const currentCategory = categorySlug ? categories.find(c => c.slug === categorySlug) : undefined;
  const categoryId = currentCategory?.id;

  // Selecting a parent also shows everything filed under its subcategories.
  const matchingIds = currentCategory ? collectCategoryIds(currentCategory) : [];
  const ancestors = currentCategory ? getCategoryAncestors(currentCategory, categories) : [];
  const activeRoot = currentCategory ? (ancestors[0] ?? currentCategory) : undefined;
  const activePathIds = currentCategory
    ? [...ancestors.map(c => c.id), currentCategory.id]
    : [];

  const groups = currentCategory
    ? unfilteredGroups.filter((product) =>
        matchingIds.includes(product.category) ||
        product.categories?.some((id) => matchingIds.includes(id)),
      )
    : unfilteredGroups;

  return (
    <div className="bg-gray-50 min-h-screen pb-6 md:pb-8">
      {/* Breadcrumb / Page Header */}
      <div className="bg-white border-b border-border mb-2 md:mb-4">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 py-1.5 md:py-4">
          {ancestors.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-0.5 flex flex-wrap items-center gap-0.5 text-[10px] text-gray-500 md:mb-1 md:text-xs">
              <Link href="/products" className="hover:text-primary">Semua Produk</Link>
              {ancestors.map((ancestor) => (
                <span key={ancestor.id} className="flex items-center gap-0.5">
                  <ChevronRight size={12} className="text-gray-300" />
                  <Link href={`/products?category=${ancestor.slug}`} className="hover:text-primary">
                    {ancestor.name}
                  </Link>
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">
            {search
              ? `Hasil pencarian untuk "${search}"`
              : currentCategory
                ? currentCategory.name
                : 'Semua Produk Sablon'}
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1">
            {currentCategory?.description
              ? `${currentCategory.description} · ${groups.length} produk`
              : `Menampilkan ${groups.length} produk`}
          </p>
        </div>
      </div>

      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          
          {/* Mobile Categories (Horizontal Scroll) */}
          <CategoryChips
            categories={rootCategories}
            activeId={categoryId}
            activeRoot={activeRoot}
          />

          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <CategorySidebar
              categories={rootCategories}
              activeId={categoryId}
              activePathIds={activePathIds}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {groups.length === 0 ? (
              <div className="bg-white p-6 md:p-12 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4 text-gray-400">
                  <Search size={24} className="md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 md:mb-2">Produk tidak ditemukan</h3>
                <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 max-w-md">
                  Kami tidak dapat menemukan produk sablon yang sesuai dengan filter Anda. Coba sesuaikan pencarian atau kategori.
                </p>
                <Link href="/products" className="h-9 md:h-10 px-4 md:px-6 inline-flex items-center justify-center bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Hapus Filter
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 md:gap-6">
                {groups.map(group => (
                  <ProductCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

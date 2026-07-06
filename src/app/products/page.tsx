import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";
import { Search } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const categoryId = typeof params.category === 'string' ? params.category : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  const groups = await productService.getProductGroups({ categoryId, search });
  const categories = await categoryService.getCategories();

  return (
    <div className="bg-gray-50 min-h-screen pb-6 md:pb-8">
      {/* Breadcrumb / Page Header */}
      <div className="bg-white border-b border-border mb-2 md:mb-4">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4 py-1.5 md:py-4">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">
            {search ? `Search results for "${search}"` : categoryId ? 'Category Products' : 'All Products'}
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1">Showing {groups.length} products</p>
        </div>
      </div>

      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          
          {/* Mobile Categories (Horizontal Scroll) */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto hide-scrollbar">
            <div className="flex gap-1 pb-1.5">
              <Link 
                href="/products" 
                className={`shrink-0 h-7 px-2 flex items-center rounded border text-[11px] font-medium transition-colors ${!categoryId ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'}`}
              >
                All
              </Link>
              {categories.map(c => (
                <Link 
                  key={c.id}
                  href={`/products?category=${c.id}`} 
                  className={`shrink-0 h-7 px-2 flex items-center rounded border text-[11px] font-medium transition-colors ${categoryId === c.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50'}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">Categories</h2>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/products" 
                    className={`block text-sm transition-colors ${!categoryId ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                  >
                    All Categories
                  </Link>
                </li>
                {categories.map(c => (
                  <li key={c.id}>
                    <Link 
                      href={`/products?category=${c.id}`} 
                      className={`block text-sm transition-colors ${categoryId === c.id ? 'text-primary font-medium' : 'text-gray-600 hover:text-primary'}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {groups.length === 0 ? (
              <div className="bg-white p-6 md:p-12 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 md:mb-4 text-gray-400">
                  <Search size={24} className="md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 md:mb-2">No products found</h3>
                <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6 max-w-md">
                  We couldn't find any products matching your current filters. Try adjusting your search or category selection.
                </p>
                <Link href="/products" className="h-9 md:h-10 px-4 md:px-6 inline-flex items-center justify-center bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                  Clear Filters
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

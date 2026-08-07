import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-6 md:pb-8">
      {/* Header halaman */}
      <div className="mb-2 border-b border-border bg-white md:mb-4">
        <div className="w-full px-2 py-1.5 sm:container sm:mx-auto sm:px-4 md:py-4">
          <Skeleton className="h-6 w-56 md:h-8 md:w-80" />
          <Skeleton className="mt-1 h-3 w-32 md:mt-2 md:h-4 md:w-44" />
        </div>
      </div>

      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
        <div className="flex flex-col gap-4 lg:flex-row md:gap-8">
          {/* Chip kategori (mobile) */}
          <div className="flex gap-2 overflow-hidden lg:hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
            ))}
          </div>

          {/* Sidebar kategori (desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
              <Skeleton className="mb-3 h-5 w-28" />
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          </aside>

          {/* Grid produk */}
          <main className="flex-1">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
                >
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="flex flex-1 flex-col gap-2 p-1.5 md:p-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-auto h-5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

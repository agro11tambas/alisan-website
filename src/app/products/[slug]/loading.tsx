import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 pb-24 md:pb-8">
      {/* Breadcrumb (desktop) */}
      <div className="hidden border-b border-border bg-white shadow-sm md:block">
        <div className="container mx-auto px-4 py-3">
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="w-full pt-12 sm:container sm:mx-auto sm:px-4 md:mt-3 md:pt-0">
        <div className="md:rounded-xl md:border md:border-gray-100 md:bg-white md:p-6 md:shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            {/* Galeri */}
            <div className="w-full md:w-1/2">
              <Skeleton className="aspect-square w-full sm:rounded-xl" />
              <div className="mt-2 flex gap-2 px-3 sm:px-0">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="size-16 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Info & opsi produk */}
            <div className="flex w-full flex-col gap-4 px-3 sm:px-0 md:w-1/2">
              <div className="space-y-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>

              <Skeleton className="h-9 w-48" />

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-28 rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-28 rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

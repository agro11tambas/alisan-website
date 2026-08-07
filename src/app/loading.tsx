import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <section className="bg-white pt-1 pb-1.5 md:pt-2 md:pb-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <Skeleton className="aspect-[1672/941] w-full rounded-lg md:rounded-2xl" />
        </div>
      </section>

      {/* Kategori */}
      <section className="bg-white py-1.5 md:py-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="mb-1.5 flex items-center justify-between gap-3 md:mb-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40 md:h-8 md:w-56" />
              <Skeleton className="hidden h-4 w-64 md:block" />
            </div>
            <Skeleton className="h-8 w-32 rounded-full md:h-10 md:w-44" />
          </div>

          <div className="-mx-2 px-2 pb-1 md:mx-0 md:p-0">
            <div className="flex min-w-full gap-1.5 md:grid md:grid-cols-10">
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="min-h-20 flex-[0_0_23%] rounded-lg md:min-h-28 md:flex-none"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Product */}
      <section className="border-t border-border bg-gray-50/50 py-1.5 md:py-6">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
          <div className="mb-1.5 flex items-center justify-between md:mb-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 md:h-8 md:w-60" />
              <Skeleton className="hidden h-4 w-72 md:block" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full md:h-10 md:w-40" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
              >
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="flex flex-1 flex-col gap-2 p-1.5 md:p-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-auto h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

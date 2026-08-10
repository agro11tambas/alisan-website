"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import OrderList from "@/components/order/OrderList";

export default function OrdersPage() {
  const router = useRouter();
  const { loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!customerLoading && !isLoggedIn) router.replace("/login");
  }, [customerLoading, isLoggedIn, router]);

  const handleTotalChange = useCallback((value: number) => setTotal(value), []);

  return (
    <main className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/account"
            aria-label="Kembali ke profil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
            <p className="text-xs text-gray-500">
              {total !== null ? `${total} pesanan melalui website` : "Riwayat pesanan website"}
            </p>
          </div>
        </div>

        <OrderList filter="all" onTotalChange={handleTotalChange} />
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { CatalogIndexEntry } from "@/types";
import { orderService, type SaleOrder } from "@/services/orderService";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { getOrderStage } from "@/hooks/use-customer-orders";
import { buildCatalogLookup, findCatalogEntry } from "@/utils/catalogIndexUtils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Cukup pesanan terakhir: "Beli Lagi" tidak perlu riwayat penuh. Jumlahnya
 * dilebihkan dari jumlah kartu karena pesanan yang belum selesai disaring
 * dulu, jadi tidak semua pesanan yang diambil ikut dipakai.
 */
const RECENT_ORDER_COUNT = 40;
const MAX_CARDS = 12;
/**
 * Riwayat pesanan tidak berubah tiap kali beranda dibuka, jadi hasilnya
 * dipakai ulang sebentar supaya pindah halaman bolak-balik tidak memanggil
 * API berkali-kali. TTL-nya pendek supaya produk dari pesanan yang baru saja
 * dibuat tetap cepat muncul.
 */
const CACHE_TTL_MS = 60_000;

let cachedOrders: { orders: SaleOrder[]; fetchedAt: number } | null = null;
let ordersRequest: Promise<SaleOrder[]> | null = null;

function loadRecentOrders() {
  if (cachedOrders && Date.now() - cachedOrders.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cachedOrders.orders);
  }

  ordersRequest ??= orderService
    .getOrders(1, RECENT_ORDER_COUNT)
    .then((page) => {
      cachedOrders = { orders: page.data, fetchedAt: Date.now() };
      return page.data;
    })
    .finally(() => {
      ordersRequest = null;
    });

  return ordersRequest;
}

const formatPrice = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

/**
 * Produk yang pernah dibeli, terbaru lebih dulu dan tanpa duplikat. Hanya
 * pesanan yang sudah selesai yang dihitung: selama pesanan masih menunggu
 * verifikasi atau diproses, barangnya belum tentu jadi dibeli, jadi belum
 * pantas ditawarkan untuk dibeli lagi. Satu pesanan bisa berisi beberapa
 * varian dari grup yang sama, dan kartunya tingkat grup, jadi grup yang sama
 * hanya tampil sekali.
 */
function collectPurchasedProducts(orders: SaleOrder[], catalog: CatalogIndexEntry[]) {
  const lookup = buildCatalogLookup(catalog);
  const products: CatalogIndexEntry[] = [];
  const seenSlugs = new Set<string>();

  const newestFirst = orders
    .filter((order) => getOrderStage(order) === "completed")
    .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

  for (const order of newestFirst) {
    for (const item of order.items) {
      const entry = findCatalogEntry(lookup, item);

      if (!entry || seenSlugs.has(entry.slug)) continue;

      seenSlugs.add(entry.slug);
      products.push(entry);

      if (products.length >= MAX_CARDS) return products;
    }
  }

  return products;
}

function BuyAgainCard({ product }: { product: CatalogIndexEntry }) {
  const hasDiscount = product.price < product.originalPrice;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="group flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden border-b border-gray-100 bg-gray-50">
          {product.image && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 45vw, 25vw"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-1.5 md:gap-2 md:p-3">
          <h3 className="line-clamp-2 text-xs font-medium leading-tight text-gray-800 transition-colors group-hover:text-primary md:text-sm">
            {product.name}
          </h3>

          <div className="mt-auto flex flex-col">
            <span className="text-[10px] font-medium text-gray-500 md:text-xs">Mulai dari</span>
            {hasDiscount && (
              <span className="text-[10px] leading-none text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold leading-tight text-primary sm:text-lg">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-1.5 pb-1.5 md:px-3 md:pb-3">
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-green-600 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:scale-95 md:h-9 md:text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Beli Lagi
        </Link>
      </div>
    </div>
  );
}

function BuyAgainSkeleton() {
  return (
    <div className="flex gap-1.5 md:gap-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex-[0_0_42%] sm:flex-[0_0_30%] md:flex-[0_0_23%]"
        >
          <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-1.5 shadow-sm md:p-3">
            <Skeleton className="aspect-square w-full rounded-md" />
            <Skeleton className="mt-2 h-3 w-4/5" />
            <Skeleton className="mt-2 h-4 w-2/5" />
            <Skeleton className="mt-2 h-8 w-full rounded-full md:h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Produk dari pesanan customer yang sudah selesai, ditampilkan setelah
 * kategori supaya pesanan rutin bisa diulang tanpa mencari lagi. Section ini
 * tidak ada untuk pengunjung yang belum masuk, yang belum punya pesanan
 * selesai, atau yang produknya tidak lagi ada di katalog.
 */
export default function BuyAgainSection({ catalog }: { catalog: CatalogIndexEntry[] }) {
  const { customer, loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const [loaded, setLoaded] = useState<{ owner: string; orders: SaleOrder[] } | null>(null);

  // Riwayat selalu dipasangkan dengan pemiliknya supaya pesanan akun lama tidak
  // sempat terlihat sekejap setelah ganti akun di tab yang sama.
  const owner = String(customer?.customer_id ?? customer?.id ?? "");

  useEffect(() => {
    if (customerLoading) return;

    if (!isLoggedIn) {
      cachedOrders = null;
      return;
    }

    let active = true;

    loadRecentOrders()
      .then((recentOrders) => {
        if (active) setLoaded({ owner, orders: recentOrders });
      })
      .catch((error) => {
        // Beranda tetap utuh tanpa section ini, jadi kegagalan riwayat pesanan
        // cukup dicatat: tidak ada pesan error yang perlu dilihat customer.
        console.error("Gagal mengambil produk yang pernah dibeli:", error);
        if (active) setLoaded({ owner, orders: [] });
      });

    return () => {
      active = false;
    };
  }, [customerLoading, isLoggedIn, owner]);

  const orders = loaded?.owner === owner ? loaded.orders : null;
  const isLoading = isLoggedIn && orders === null;

  const products = useMemo(
    () => (orders ? collectPurchasedProducts(orders, catalog) : []),
    [orders, catalog],
  );

  if (!isLoggedIn) return null;
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-white py-1.5 md:py-6">
      <div className="w-full px-2 sm:container sm:mx-auto sm:px-4">
        <div className="mb-1.5 flex items-center justify-between gap-3 md:mb-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 md:mb-1 md:text-2xl">
              Beli Lagi
            </h2>
            <p className="hidden text-sm text-gray-500 md:block">
              Produk dari pesanan Anda yang sudah selesai
            </p>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-green-600 px-3 text-[11px] font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 active:scale-95 md:h-10 md:px-5 md:text-sm"
          >
            Lihat Riwayat
          </Link>
        </div>

        <div className="-mx-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
          {isLoading && products.length === 0 ? (
            <BuyAgainSkeleton />
          ) : (
            <div className="flex snap-x snap-mandatory gap-1.5 md:gap-6">
              {products.map((product) => (
                <div
                  key={product.slug}
                  className="min-w-0 flex-[0_0_42%] snap-start sm:flex-[0_0_30%] md:flex-[0_0_23%]"
                >
                  <BuyAgainCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

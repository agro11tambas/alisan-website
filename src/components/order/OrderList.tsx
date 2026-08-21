"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  Package,
  ReceiptText,
} from "lucide-react";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import { orderService, type OrderStage, type SaleOrder } from "@/services/orderService";

export type OrderFilter = "all" | OrderStage;

const PER_PAGE = 10;
const FETCH_CHUNK = 100;
const MAX_CHUNKS = 10;
/**
 * Jeda pengecekan status pesanan. Endpoint sync hanya membaca beberapa kolom
 * kunci, jadi cukup murah untuk dipanggil setiap beberapa detik.
 */
const SYNC_INTERVAL_MS = 8000;

/**
 * Tahapnya dihitung backend dari waiting list dan delivery. Kalau field-nya
 * belum ada (respons lama), pesanan dianggap sudah diverifikasi begitu nomornya
 * berubah dari SO menjadi INV.
 */
export const getOrderStage = (order: SaleOrder): OrderStage =>
  order.fulfillment?.stage ??
  (order.order_number.trim().toUpperCase().startsWith("INV")
    ? "processing"
    : "waiting_verification");

const stageBadge: Record<OrderStage, { label: string; className: string }> = {
  waiting_verification: {
    label: "Menunggu Verifikasi",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  processing: {
    label: "Diproses",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  completed: {
    label: "Selesai",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatMode = (value: string) =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const paymentStatusLabel: Record<string, string> = {
  Paid: "Lunas",
  "Partially Paid": "Dibayar Sebagian",
  Unpaid: "Belum Dibayar",
};

const emptyStateText: Record<OrderFilter, { title: string; description: string }> = {
  all: {
    title: "Belum ada pesanan",
    description: "Produk yang dipesan melalui website akan muncul di sini.",
  },
  waiting_verification: {
    title: "Belum ada pesanan yang menunggu verifikasi",
    description: "Pesanan baru akan muncul di sini sampai diverifikasi admin.",
  },
  processing: {
    title: "Belum ada pesanan yang diproses",
    description: "Pesanan yang sedang dikerjakan atau diantar akan muncul di sini.",
  },
  completed: {
    title: "Belum ada pesanan yang selesai",
    description: "Pesanan yang seluruh barangnya sudah diantar akan muncul di sini.",
  },
};

/** Foto produk seperti di keranjang; ikon paket dipakai kalau fotonya belum ada. */
function OrderItemImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Package size={20} />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
      <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
    </div>
  );
}

export function OrderCard({ order }: { order: SaleOrder }) {
  const paymentStatus = order.payment_status ?? "Unpaid";
  const badge = stageBadge[getOrderStage(order)];

  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:hidden">
      <header className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{order.order_number}</p>
          <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.order_date)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge.className}`}
        >
          {badge.label}
        </span>
      </header>

      <div className="divide-y divide-gray-100">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
            <OrderItemImage src={item.image_url} alt={item.product_name} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-gray-900">{item.product_name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {item.quantity.toLocaleString("id-ID")} {item.unit_name || "Pcs"}
                {item.mode ? ` · Mode: ${formatMode(item.mode)}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-gray-800">
              {formatCurrency(item.total_after_discount ?? item.subtotal)}
            </p>
          </div>
        ))}
      </div>

      <footer className="space-y-3 border-t border-gray-100 px-4 py-4">
        {order.shipping.address && (
          <div className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span>
              {order.shipping.business_name && (
                <strong className="font-semibold text-gray-700">
                  {order.shipping.business_name} ·{" "}
                </strong>
              )}
              {order.shipping.address}
            </span>
          </div>
        )}

        <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs">
          {order.discount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Diskon</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span>Status Pembayaran</span>
            <span className="font-semibold text-gray-700">
              {paymentStatusLabel[paymentStatus] ?? paymentStatus}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-gray-900">
            <span>Total Pesanan</span>
            <span className="text-primary">{formatCurrency(order.grand_total)}</span>
          </div>
        </div>
      </footer>
    </article>
  );
}

export function DesktopOrderCard({ order }: { order: SaleOrder }) {
  const paymentStatus = order.payment_status ?? "Unpaid";
  const badge = stageBadge[getOrderStage(order)];

  return (
    <article className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
      <header className="flex items-center justify-between gap-6 border-b border-gray-200 bg-gray-50/70 px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nomor Pesanan</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tanggal</p>
            <p className="mt-1 text-sm font-medium text-gray-700">{formatDate(order.order_date)}</p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left">
          <thead className="border-b border-gray-100 bg-white text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-[36%] px-6 py-3 font-semibold">Produk</th>
              <th className="w-[16%] px-4 py-3 font-semibold">Mode</th>
              <th className="w-[16%] px-4 py-3 text-center font-semibold">Jumlah</th>
              <th className="w-[16%] px-4 py-3 text-right font-semibold">Harga</th>
              <th className="w-[16%] px-6 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <tr key={item.id} className="text-sm text-gray-700">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <OrderItemImage src={item.image_url} alt={item.product_name} />
                    <span className="font-semibold text-gray-900">{item.product_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4">{item.mode ? formatMode(item.mode) : "-"}</td>
                <td className="px-4 py-4 text-center">
                  {item.quantity.toLocaleString("id-ID")} {item.unit_name || "Pcs"}
                </td>
                <td className="px-4 py-4 text-right">{formatCurrency(item.price)}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">
                  {formatCurrency(item.total_after_discount ?? item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="grid grid-cols-[minmax(0,1fr)_320px] gap-8 border-t border-gray-200 bg-gray-50/40 px-6 py-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Alamat Pengiriman</p>
          {order.shipping.address ? (
            <div className="flex max-w-xl items-start gap-2 text-sm leading-relaxed text-gray-600">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>
                {order.shipping.business_name && (
                  <strong className="font-semibold text-gray-800">
                    {order.shipping.business_name} ·{" "}
                  </strong>
                )}
                {order.shipping.address}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Alamat tidak tersedia</p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {order.discount > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Diskon</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span>Status Pembayaran</span>
            <span className="font-semibold text-gray-700">
              {paymentStatusLabel[paymentStatus] ?? paymentStatus}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
            <span>Total Pesanan</span>
            <span className="text-primary">{formatCurrency(order.grand_total)}</span>
          </div>
        </div>
      </footer>
    </article>
  );
}

/**
 * The API paginates without a verification filter, so the list is fetched in
 * large chunks and both filtering and paging are done on the client.
 */
async function fetchAllOrders() {
  const firstChunk = await orderService.getOrders(1, FETCH_CHUNK);
  const chunkCount = Math.min(firstChunk.last_page, MAX_CHUNKS);

  if (chunkCount <= 1) return firstChunk.data;

  const restChunks = await Promise.all(
    Array.from({ length: chunkCount - 1 }, (_, index) =>
      orderService.getOrders(index + 2, FETCH_CHUNK)
    )
  );

  return restChunks.reduce((all, chunk) => all.concat(chunk.data), firstChunk.data);
}

/**
 * Sidik jari status pesanan terkini. Mengembalikan null kalau backend belum
 * punya endpoint sync, supaya halaman tetap jalan seperti sebelumnya.
 */
async function readSyncVersion() {
  try {
    const state = await orderService.getOrdersSync();

    return state?.version ?? null;
  } catch {
    return null;
  }
}

export default function OrderList({
  filter = "all",
  onTotalChange,
}: {
  filter?: OrderFilter;
  onTotalChange?: (total: number) => void;
}) {
  const { loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  /** Sidik jari status pesanan yang sudah tercermin di `orders`. */
  const syncVersionRef = useRef<string | null>(null);
  /** Penjaga supaya pengecekan yang lambat tidak ditumpuk oleh interval. */
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (customerLoading) return;

    if (!isLoggedIn) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    const request = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        // Sidik jari diambil lebih dulu supaya perubahan yang terjadi di
        // sela-sela pengambilan daftar tidak ikut ter-"tandai" sudah dibaca:
        // paling buruk polling berikutnya menyegarkan sekali lagi.
        syncVersionRef.current = await readSyncVersion();

        const result = await fetchAllOrders();
        if (!isActive) return;
        setOrders(result);
      } catch (requestError) {
        console.error("Gagal mengambil riwayat pesanan:", requestError);
        if (isActive) setError("Riwayat pesanan gagal dimuat. Silakan coba kembali.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(request);
    };
  }, [customerLoading, isLoggedIn, retryKey]);

  /**
   * Pesanan bisa berubah tahap kapan saja dari sisi admin (Mark as Sale List,
   * assign produksi, surat jalan selesai). Halaman ini menanyakan sidik jari
   * status tiap beberapa detik dan baru mengambil ulang daftar lengkap kalau
   * sidik jarinya berubah, jadi kartu pesanan pindah tab dengan sendirinya
   * tanpa perlu di-refresh.
   *
   * Polling berhenti saat tab tidak terlihat, lalu langsung mengecek sekali
   * begitu tab dibuka lagi.
   */
  useEffect(() => {
    if (customerLoading || !isLoggedIn) return;

    let isActive = true;
    let timer: number | undefined;

    const refreshOrders = async () => {
      const result = await fetchAllOrders();
      if (isActive) setOrders(result);
    };

    const checkForUpdates = async () => {
      if (!isActive || isCheckingRef.current || document.hidden) return;

      isCheckingRef.current = true;

      try {
        const version = await readSyncVersion();

        if (version && version !== syncVersionRef.current) {
          // Disegarkan diam-diam: tanpa spinner, supaya daftar yang sedang
          // dibaca customer tidak berkedip tiap ada perubahan.
          await refreshOrders();
          syncVersionRef.current = version;
        }
      } catch (syncError) {
        // Jaringan putus sesaat bukan alasan menampilkan error: percobaan
        // berikutnya jalan beberapa detik lagi.
        console.error("Gagal menyinkronkan status pesanan:", syncError);
      } finally {
        isCheckingRef.current = false;
      }
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(checkForUpdates, SYNC_INTERVAL_MS);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.clearInterval(timer);
        return;
      }

      void checkForUpdates();
      start();
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkForUpdates);

    return () => {
      isActive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkForUpdates);
    };
  }, [customerLoading, isLoggedIn, retryKey]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((order) => getOrderStage(order) === filter);
  }, [orders, filter]);

  const lastPage = Math.max(1, Math.ceil(filteredOrders.length / PER_PAGE));
  const currentPage = Math.min(page, lastPage);
  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (isLoading) return;
    onTotalChange?.(filteredOrders.length);
  }, [isLoading, filteredOrders.length, onTotalChange]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (customerLoading || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <ReceiptText size={24} className="text-gray-400" />
        </div>
        <h2 className="mb-1 text-base font-bold text-gray-900">Masuk untuk melihat pesanan</h2>
        <p className="mb-5 text-sm text-gray-500">
          Riwayat pesanan hanya tersedia setelah Anda masuk ke akun.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Masuk
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-100 bg-white px-6 py-10 text-center shadow-sm">
        <ReceiptText size={36} className="mx-auto mb-3 text-red-300" />
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Coba Lagi
        </button>
      </section>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <section className="rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <ClipboardList size={24} className="text-gray-400" />
        </div>
        <h2 className="mb-1 text-base font-bold text-gray-900">{emptyStateText[filter].title}</h2>
        <p className="mb-5 text-sm text-gray-500">{emptyStateText[filter].description}</p>
        <Link
          href="/products"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Mulai Belanja
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {visibleOrders.map((order) => (
          <div key={order.id}>
            <OrderCard order={order} />
            <DesktopOrderCard order={order} />
          </div>
        ))}
      </div>

      {lastPage > 1 && (
        <nav className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} /> Sebelumnya
          </button>
          <span className="text-xs font-medium text-gray-500">
            Halaman {currentPage} dari {lastPage}
          </span>
          <button
            type="button"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= lastPage}
            className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya <ChevronRight size={15} />
          </button>
        </nav>
      )}
    </>
  );
}

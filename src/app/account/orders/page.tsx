"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MapPin,
  Package,
  ReceiptText,
} from "lucide-react";
import { useCurrentCustomer } from "@/hooks/use-current-customer";
import {
  orderService,
  type SaleOrder,
  type SaleOrderPagination,
} from "@/services/orderService";

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


function OrderCard({ order }: { order: SaleOrder }) {
  const paymentStatus = order.payment_status ?? "Unpaid";
  const isVerified = order.order_number.trim().toUpperCase().startsWith("INV");

  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:hidden">
      <header className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{order.order_number}</p>
          <p className="mt-0.5 text-xs text-gray-500">{formatDate(order.order_date)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isVerified
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {isVerified ? "Sudah Diverifikasi" : "Belum Diverifikasi"}
        </span>
      </header>

      <div className="divide-y divide-gray-100">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package size={18} />
            </div>
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

function DesktopOrderCard({ order }: { order: SaleOrder }) {
  const paymentStatus = order.payment_status ?? "Unpaid";
  const isVerified = order.order_number.trim().toUpperCase().startsWith("INV");

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
        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${isVerified
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {isVerified ? "Sudah Diverifikasi" : "Belum Diverifikasi"}
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package size={18} />
                    </div>
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
export default function OrdersPage() {
  const router = useRouter();
  const { loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [pagination, setPagination] = useState<SaleOrderPagination | null>(null);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerLoading && !isLoggedIn) router.replace("/login");
  }, [customerLoading, isLoggedIn, router]);

  useEffect(() => {
    if (customerLoading || !isLoggedIn) return;

    let isActive = true;
    const request = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const result = await orderService.getOrders(page);
        if (!isActive) return;
        setOrders(result.data);
        setPagination(result);
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
  }, [customerLoading, isLoggedIn, page, retryKey]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              {pagination ? `${pagination.total} pesanan melalui website` : "Riwayat pesanan website"}
            </p>
          </div>
        </div>

        {isLoading || customerLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
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
        ) : orders.length === 0 ? (
          <section className="rounded-xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <ClipboardList size={24} className="text-gray-400" />
            </div>
            <h2 className="mb-1 text-base font-bold text-gray-900">Belum ada pesanan</h2>
            <p className="mb-5 text-sm text-gray-500">
              Produk yang dipesan melalui website akan muncul di sini.
            </p>
            <Link
              href="/products"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Mulai Belanja
            </Link>
          </section>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id}>
                  <OrderCard order={order} />
                  <DesktopOrderCard order={order} />
                </div>
              ))}
            </div>

            {pagination && pagination.last_page > 1 && (
              <nav className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Sebelumnya
                </button>
                <span className="text-xs font-medium text-gray-500">
                  Halaman {pagination.current_page} dari {pagination.last_page}
                </span>
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page >= pagination.last_page}
                  className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya <ChevronRight size={15} />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
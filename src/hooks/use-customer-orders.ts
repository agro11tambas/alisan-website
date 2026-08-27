"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { orderService, type OrderStage, type SaleOrder } from "@/services/orderService";
import { useCurrentCustomer } from "@/hooks/use-current-customer";

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

type OrdersState = {
  orders: SaleOrder[];
  isLoading: boolean;
  error: string;
};

const INITIAL_STATE: OrdersState = { orders: [], isLoading: true, error: "" };

/**
 * Daftar pesanan disimpan di level modul, bukan di dalam komponen: halaman
 * keranjang memakainya dua kali sekaligus (badge jumlah di tab dan daftar di
 * tab aktif), dan keduanya harus berbagi satu pengambilan data serta satu
 * polling — bukan dua.
 */
let state: OrdersState = INITIAL_STATE;
const listeners = new Set<() => void>();

/** Sidik jari status pesanan yang sudah tercermin di `state.orders`. */
let syncVersion: string | null = null;
/** Penjaga supaya pengecekan yang lambat tidak ditumpuk oleh interval. */
let isChecking = false;
let hasLoaded = false;
let loadRequest: Promise<void> | null = null;
let subscriberCount = 0;
let pollTimer: number | undefined;

function publish(patch: Partial<OrdersState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

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
    const syncState = await orderService.getOrdersSync();

    return syncState?.version ?? null;
  } catch {
    return null;
  }
}

function loadOrders({ force = false }: { force?: boolean } = {}) {
  if (loadRequest) return loadRequest;
  if (hasLoaded && !force) return Promise.resolve();

  publish({ isLoading: true, error: "" });

  loadRequest = (async () => {
    try {
      // Sidik jari diambil lebih dulu supaya perubahan yang terjadi di
      // sela-sela pengambilan daftar tidak ikut ter-"tandai" sudah dibaca:
      // paling buruk polling berikutnya menyegarkan sekali lagi.
      syncVersion = await readSyncVersion();

      const orders = await fetchAllOrders();
      hasLoaded = true;
      publish({ orders, isLoading: false, error: "" });
    } catch (error) {
      console.error("Gagal mengambil riwayat pesanan:", error);
      publish({ isLoading: false, error: "Riwayat pesanan gagal dimuat. Silakan coba kembali." });
    } finally {
      loadRequest = null;
    }
  })();

  return loadRequest;
}

function resetOrders() {
  hasLoaded = false;
  syncVersion = null;
  publish({ orders: [], isLoading: false, error: "" });
}

/**
 * Pesanan bisa berubah tahap kapan saja dari sisi admin (Mark as Sale List,
 * assign produksi, surat jalan selesai). Sidik jari status ditanyakan tiap
 * beberapa detik dan daftar lengkap baru diambil ulang kalau sidik jarinya
 * berubah, jadi kartu pesanan pindah tab dengan sendirinya tanpa di-refresh.
 */
async function checkForUpdates() {
  if (!hasLoaded || isChecking || document.hidden) return;

  isChecking = true;

  try {
    const version = await readSyncVersion();

    if (version && version !== syncVersion) {
      // Disegarkan diam-diam: tanpa spinner, supaya daftar yang sedang dibaca
      // customer tidak berkedip tiap ada perubahan.
      const orders = await fetchAllOrders();
      publish({ orders });
      syncVersion = version;
    }
  } catch (error) {
    // Jaringan putus sesaat bukan alasan menampilkan error: percobaan
    // berikutnya jalan beberapa detik lagi.
    console.error("Gagal menyinkronkan status pesanan:", error);
  } finally {
    isChecking = false;
  }
}

/** Polling berhenti saat tab tidak terlihat, lalu mengecek sekali saat dibuka lagi. */
function handleVisibility() {
  if (document.hidden) {
    window.clearInterval(pollTimer);
    return;
  }

  void checkForUpdates();
  pollTimer = window.setInterval(() => void checkForUpdates(), SYNC_INTERVAL_MS);
}

const runCheck = () => void checkForUpdates();

/** Polling dinyalakan oleh pemakai pertama dan dimatikan oleh pemakai terakhir. */
function startPolling() {
  subscriberCount += 1;

  if (subscriberCount === 1) {
    pollTimer = window.setInterval(runCheck, SYNC_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", runCheck);
  }

  return () => {
    subscriberCount -= 1;

    if (subscriberCount === 0) {
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", runCheck);
    }
  };
}

export function useCustomerOrders() {
  const { loading: customerLoading, isLoggedIn } = useCurrentCustomer();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (customerLoading) return;

    if (!isLoggedIn) {
      resetOrders();
      return;
    }

    void loadOrders();

    return startPolling();
  }, [customerLoading, isLoggedIn]);

  const retry = useCallback(() => {
    void loadOrders({ force: true });
  }, []);

  return {
    orders: snapshot.orders,
    isLoading: customerLoading || (isLoggedIn && snapshot.isLoading),
    error: snapshot.error,
    isLoggedIn,
    retry,
  };
}

/** Jumlah pesanan per tahap, dipakai badge di tab halaman keranjang. */
export function useOrderStageCounts(): Record<OrderStage, number> {
  const { orders } = useCustomerOrders();

  return orders.reduce(
    (counts, order) => {
      counts[getOrderStage(order)] += 1;
      return counts;
    },
    { waiting_verification: 0, processing: 0, completed: 0 } as Record<OrderStage, number>
  );
}

"use client";

import { useEffect } from "react";

import { CartItem } from "@/types";
import { cartService } from "@/services/cartService";
import { useCartStore } from "@/stores/useCartStore";
import { CUSTOMER_AUTH_CHANGED_EVENT } from "@/lib/customer-auth-events";

const CART_ACCOUNT_STORAGE_KEY = "alisan-cart-account-id";
const SYNC_DELAY_MS = 400;

function mergeGuestCart(remoteItems: CartItem[], localItems: CartItem[]) {
  const mergedItems = new Map(remoteItems.map((item) => [item.id, item]));

  localItems.forEach((localItem) => {
    const remoteItem = mergedItems.get(localItem.id);

    if (!remoteItem) {
      mergedItems.set(localItem.id, localItem);
      return;
    }

    mergedItems.set(localItem.id, {
      ...remoteItem,
      ...localItem,
      quantity: Math.max(remoteItem.quantity, localItem.quantity),
    });
  });

  return Array.from(mergedItems.values());
}

function itemsMatch(first: CartItem[], second: CartItem[]) {
  return JSON.stringify(first) === JSON.stringify(second);
}

export default function CartSync() {
  useEffect(() => {
    let disposed = false;
    let initialized = false;
    let applyingRemoteCart = false;
    let hydrationVersion = 0;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    const replaceItems = (items: CartItem[]) => {
      applyingRemoteCart = true;
      useCartStore.getState().replaceItems(items);
      applyingRemoteCart = false;
    };

    const clearAccountCart = () => {
      initialized = false;
      hydrationVersion += 1;
      localStorage.removeItem(CART_ACCOUNT_STORAGE_KEY);

      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }

      replaceItems([]);
    };

    const hydrateCart = async () => {
      const token = localStorage.getItem("customer_token");

      if (!token) {
        return;
      }

      const currentVersion = ++hydrationVersion;

      try {
        const remoteCart = await cartService.getCart();

        if (disposed || currentVersion !== hydrationVersion) {
          return;
        }

        const accountId = String(remoteCart.account_id);
        const previousAccountId = localStorage.getItem(CART_ACCOUNT_STORAGE_KEY);
        const localItems = useCartStore.getState().items;
        const shouldMergeGuestCart = previousAccountId !== accountId;
        const nextItems = shouldMergeGuestCart
          ? mergeGuestCart(remoteCart.items, localItems)
          : remoteCart.items;

        replaceItems(nextItems);
        localStorage.setItem(CART_ACCOUNT_STORAGE_KEY, accountId);
        initialized = true;

        if (!itemsMatch(nextItems, remoteCart.items)) {
          await cartService.syncCart(nextItems);
        }
      } catch (error) {
        initialized = true;
        console.error("Gagal menyinkronkan cart customer:", error);
      }
    };

    const unsubscribe = useCartStore.subscribe((state, previousState) => {
      if (
        disposed ||
        !initialized ||
        applyingRemoteCart ||
        state.items === previousState.items ||
        !localStorage.getItem("customer_token")
      ) {
        return;
      }

      if (syncTimer) {
        clearTimeout(syncTimer);
      }

      syncTimer = setTimeout(() => {
        void cartService.syncCart(useCartStore.getState().items).catch((error) => {
          console.error("Gagal menyimpan cart customer:", error);
        });
      }, SYNC_DELAY_MS);
    });

    const handleAuthChange = () => {
      if (localStorage.getItem("customer_token")) {
        void hydrateCart();
      } else {
        clearAccountCart();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "customer_token") {
        handleAuthChange();
      }
    };

    const handleFocus = () => {
      if (localStorage.getItem("customer_token")) {
        void hydrateCart();
      }
    };

    window.addEventListener(CUSTOMER_AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    void hydrateCart();

    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener(CUSTOMER_AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);

      if (syncTimer) {
        clearTimeout(syncTimer);
      }
    };
  }, []);

  return null;
}

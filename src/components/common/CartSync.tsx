"use client";

import { useEffect } from "react";

import { CartItem } from "@/types";
import { cartService } from "@/services/cartService";
import { productService } from "@/services/productService";
import { useCartStore, waitForCartHydration } from "@/stores/useCartStore";
import { CUSTOMER_AUTH_CHANGED_EVENT } from "@/lib/customer-auth-events";
import { getCartItemImage } from "@/utils/productImageUtils";

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

    const refreshImagesFromErp = async (items: CartItem[]) => {
      if (items.length === 0) return items;

      try {
        const groups = await productService.getProductGroups();
        return items.map((item) => {
          const group = groups.find((candidate) =>
            (item.groupSlug && candidate.slug === item.groupSlug)
            || String(candidate.id) === String(item.productGroupId),
          );
          if (!group) return item;

          return { ...item, image: getCartItemImage(group, item) };
        });
      } catch (error) {
        console.error("Gagal memperbarui gambar cart dari ERP:", error);
        return items;
      }
    };

    const hydrateCart = async () => {
      await waitForCartHydration();

      if (disposed) {
        return;
      }

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
        const mergedItems = shouldMergeGuestCart
          ? mergeGuestCart(remoteCart.items, localItems)
          : remoteCart.items;
        const nextItems = await refreshImagesFromErp(mergedItems);

        replaceItems(nextItems);
        localStorage.setItem(CART_ACCOUNT_STORAGE_KEY, accountId);
        initialized = true;

        if (!itemsMatch(nextItems, remoteCart.items)) {
          await cartService.syncCart(nextItems);
        }
      } catch (error) {
        initialized = true;
        console.error("Gagal menyinkronkan cart customer:", error);

        const localItems = useCartStore.getState().items;
        const refreshedItems = await refreshImagesFromErp(localItems);
        if (!disposed && !itemsMatch(localItems, refreshedItems)) {
          replaceItems(refreshedItems);
        }
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

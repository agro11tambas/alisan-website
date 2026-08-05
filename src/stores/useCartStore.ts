import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductGroup, AddOnProduct, ModePrice } from '@/types';
import { findProductCombination, getSelectedProductImage } from '@/utils/productImageUtils';

interface CartState {
  items: CartItem[];
  addItem: (
    group: ProductGroup,
    product: Product,
    quantity: number,
    mode: ModePrice,
    unitPrice: number,
    addOn?: AddOnProduct,
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  toggleSelection: (cartItemId: string) => void;
  toggleAllSelection: (selected: boolean) => void;
  clearCart: () => void;
  replaceItems: (items: CartItem[]) => void;
  clearSelectedItems: () => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (group, product, quantity, mode, unitPrice, addOn) => {
        const cartItemId = addOn
          ? `bundle-${product.id}-${addOn.id}-${mode.slug}`
          : `single-${product.id}-${mode.slug}`;

        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          const combination = addOn
            ? findProductCombination(group, product.id, addOn.id)
            : undefined;
          const selectedImage = getSelectedProductImage(group, product, addOn);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId
                  ? { ...item, quantity: item.quantity + quantity, price: unitPrice, image: selectedImage }
                  : item,
              ),
            };
          }

          const isBundle = Boolean(addOn);
          let combinationId: number | undefined;

          if (isBundle && combination) combinationId = Number(combination.id);

          const newItem: CartItem = {
            id: cartItemId,
            type: isBundle ? 'bundle' : 'single',
            productGroupId: group.id,
            groupName: group.name,
            groupSlug: group.slug,
            mainProductId: product.id,
            mainProductName: product.name,
            mainSku: product.sku,
            mainPrice: product.modePrices?.find((price) => price.slug === mode.slug)?.price
              ?? product.salePrice
              ?? product.price,
            addOnProductId: addOn?.id,
            addOnProductName: addOn?.name,
            addOnSku: addOn?.sku,
            addOnPrice: addOn?.modePrices?.find((price) => price.slug === mode.slug)?.price
              ?? addOn?.salePrice
              ?? addOn?.price,
            displayName: addOn ? `${group.name} + ${addOn.name}` : group.name,
            price: unitPrice,
            quantity,
            image: selectedImage,
            stock: addOn ? Math.min(product.stock, addOn.stock) : product.stock,
            minOrder: product.minimumOrder || 1,
            orderStep: product.orderStep || 1,
            unitName: group.unitName || 'Pcs',
            combinationId,
            modeSlug: mode.slug,
            modeName: mode.name,
            categories: group.categories,
            erpProductId: product.erpProductId,
            erpCategoryIds: product.erpCategoryIds,
            isSelected: true,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (cartItemId) => set((state) => ({
        items: state.items.filter((item) => item.id !== cartItemId),
      })),

      updateQuantity: (cartItemId, quantity) => set((state) => ({
        items: state.items.map((item) => item.id === cartItemId ? { ...item, quantity } : item),
      })),

      toggleSelection: (cartItemId) => set((state) => ({
        items: state.items.map((item) =>
          item.id === cartItemId
            ? { ...item, isSelected: item.isSelected === false }
            : item,
        ),
      })),

      toggleAllSelection: (selected) => set((state) => ({
        items: state.items.map((item) => ({ ...item, isSelected: selected })),
      })),

      clearCart: () => set({ items: [] }),
      replaceItems: (items) => set({ items }),
      clearSelectedItems: () => set((state) => ({
        items: state.items.filter((item) => item.isSelected === false),
      })),

      getSubtotal: () => get().items
        .filter((item) => item.isSelected !== false)
        .reduce((total, item) => total + item.price * item.quantity, 0),

      getTotalCount: () => get().items
        .filter((item) => item.isSelected !== false)
        .reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: 'alisan-cart-storage',
      version: 7,
      migrate: (persistedState: any, version: number) => {
        if (version !== 7) {
          const previousItems = Array.isArray(persistedState?.items) ? persistedState.items : [];
          return { items: previousItems.filter((item: CartItem) => item.type !== 'bundle') };
        }
        return persistedState;
      },
    },
  ),
);
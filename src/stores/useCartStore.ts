import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductGroup, AddOnProduct } from '@/types';

interface CartState {
  items: CartItem[];
  addItem: (group: ProductGroup, product: Product, quantity: number, addOn?: AddOnProduct) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (group, product, quantity, addOn) => {
        const cartItemId = addOn 
          ? `bundle-${product.id}-${addOn.id}` 
          : `single-${product.id}`;
        
        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
            const isBundle = !!addOn;
            let combinationId: number | undefined;

            let comboPrice: number | undefined;

            if (isBundle && (group as any)._combinations) {
              const combo = (group as any)._combinations.find((c: any) => 
                String(c.product_option_id) === String(product.id) && 
                String(c.lid_option_id) === String(addOn.id)
              );
              if (combo) {
                combinationId = combo.id;
                if (Number(combo.price) > 0) {
                  comboPrice = Number(combo.price);
                }
              }
            }

            const newItem: CartItem = {
              id: cartItemId,
              type: isBundle ? 'bundle' : 'single',
              
              productGroupId: group.id,
              groupName: group.name,
              groupSlug: group.slug,
              
              mainProductId: product.id,
              mainProductName: product.name,
              mainSku: product.sku,
              mainPrice: product.salePrice || product.price,
              
              addOnProductId: addOn?.id,
              addOnProductName: addOn?.name,
              addOnSku: addOn?.sku,
              addOnPrice: addOn ? (addOn.salePrice || addOn.price) : undefined,
              
              displayName: addOn ? `${group.name} + ${addOn.name}` : group.name,
              price: comboPrice !== undefined 
                ? comboPrice 
                : (product.salePrice || product.price) + (addOn ? (addOn.salePrice || addOn.price) : 0),
              quantity,
              image: product.image || group.image,
              stock: addOn ? Math.min(product.stock, addOn.stock) : product.stock,
              minOrder: product.minimumOrder || 1,
              orderStep: product.orderStep || 1,
              combinationId,
            };
          
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },
      
      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getTotalCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'alisan-cart-storage',
      version: 5, // Invalidate old schema
      migrate: (persistedState: any, version: number) => {
        if (version !== 5) {
          return { items: [] };
        }
        return persistedState;
      },
    }
  )
);

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
          
          const newItem: CartItem = {
            id: cartItemId,
            type: addOn ? "bundle" : "single",
            productGroupId: group.id,
            groupName: group.name,
            mainProductId: product.id,
            mainProductName: product.name,
            mainSku: product.sku,
            mainPrice: product.salePrice || product.price,
            
            addOnProductId: addOn?.id,
            addOnProductName: addOn?.name,
            addOnSku: addOn?.sku,
            addOnPrice: addOn ? (addOn.salePrice || addOn.price) : undefined,
            
            displayName: addOn ? `${group.name} + ${addOn.name}` : group.name,
            price: (product.salePrice || product.price) + (addOn ? (addOn.salePrice || addOn.price) : 0),
            quantity,
            image: product.image || group.image,
            stock: addOn ? Math.min(product.stock, addOn.stock) : product.stock,
            minOrder: product.minimumOrder || 1,
            orderStep: product.orderStep || 1,
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
      version: 3, // Invalidate old schema
    }
  )
);

import { CartItem } from "@/types";
import api from "./api";

interface CartResponse {
  success: boolean;
  data: {
    account_id: number;
    items: CartItem[];
  };
}

export const cartService = {
  async getCart() {
    const response = await api.get<CartResponse>("/ecommerce/cart");
    return response.data.data;
  },

  async syncCart(items: CartItem[]) {
    const response = await api.put<CartResponse>("/ecommerce/cart", {
      items: items.map((item) => ({
        cart_item_key: item.id,
        quantity: item.quantity,
        is_selected: item.isSelected !== false,
        item_data: item,
      })),
    });

    return response.data.data;
  },
};

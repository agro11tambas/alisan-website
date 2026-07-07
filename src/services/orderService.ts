import { api } from "./api";

export interface CreateOrderPayload {
  customer_id?: number;
  customer_address_id?: number;
  shipping?: {
    business_name?: string;
    address?: string;
    google_maps?: string;
  };
  order_date?: string;
  payment_method?: string;
  paid_amount?: number;
  notes?: string;
  items: Array<{
    ecommerce_product_id: number;
    ecommerce_variant_combination_id?: number;
    variant_option_id?: number;
    variant_option_ids?: number[];
    quantity: number;
    mode?: string;
  }>;
}

export const orderService = {
  createOrder: async (payload: CreateOrderPayload) => {
    return api.post("/ecommerce/sale-orders", payload);
  },
};

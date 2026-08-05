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

export interface SaleOrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_name: string | null;
  quantity: number;
  mode: string;
  price: number;
  subtotal: number;
  total_after_discount: number;
}

export interface SaleOrder {
  id: number;
  order_number: string;
  order_date: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  total_amount: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  remaining_amount: number;
  mode: string;
  notes: string | null;
  customer: { id: number | null; name: string | null };
  shipping: {
    address_id: number | null;
    business_name: string | null;
    address: string | null;
    google_maps: string | null;
  };
  items: SaleOrderItem[];
}

export interface SaleOrderPagination {
  current_page: number;
  data: SaleOrder[];
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

interface SaleOrderListResponse {
  success: boolean;
  message: string;
  data: SaleOrderPagination;
}
export const orderService = {
  createOrder: async (payload: CreateOrderPayload) => {
    return api.post("/ecommerce/sale-orders", payload);
  },
  getOrders: async (page = 1, perPage = 10) => {
    const response = await api.get<SaleOrderListResponse>("/ecommerce/sale-orders", {
      params: { page, per_page: perPage },
    });

    return response.data.data;
  },
};

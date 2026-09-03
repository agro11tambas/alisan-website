import api from './api';

export interface Discount {
  id: number;
  name: string;
  type: 'Percentage' | 'Fixed Amount';
  amount: number;
  minimum_based_on: 'Quantity of Items' | 'Purchase Amount';
  minimum_qty_or_amount: number;
  /**
   * Daftar syarat "Apply On", dipisah koma, mis. "Category,Mode".
   * Semuanya harus terpenuhi sekaligus. Nilai lama yang cuma satu syarat
   * ("Category", "Product") tetap sah.
   */
  apply_on: string;
  /** Bentuk terpecah dari `apply_on`; belum tentu ada di response lama. */
  apply_on_list?: string[];
  apply_on_ecommerce: 'None' | 'Category';
  products: number[];
  categories: number[];
  ecommerce_categories: number[];
  price_modes: number[];
  price_mode_slugs: string[];
}

export const getActiveDiscounts = async (): Promise<Discount[]> => {
  try {
    const response = await api.get('/ecommerce/discounts');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return [];
  }
};

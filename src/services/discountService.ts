import api from './api';

export interface Discount {
  id: number;
  name: string;
  type: 'Percentage' | 'Fixed Amount';
  amount: number;
  minimum_based_on: 'Quantity of Items' | 'Purchase Amount';
  minimum_qty_or_amount: number;
  apply_on: 'Product' | 'Category';
  apply_on_ecommerce: 'None' | 'Category';
  products: number[];
  categories: number[];
  ecommerce_categories: number[];
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

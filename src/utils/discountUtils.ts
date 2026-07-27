import { CartItem } from '@/types';
import { Discount } from '@/services/discountService';

export const calculateItemDiscounts = (items: CartItem[], discounts: Discount[]): Record<string, number> => {
  const itemDiscounts: Record<string, number> = {};
  if (!discounts || discounts.length === 0) return itemDiscounts;

  const eligibleDiscounts: Record<string, Discount[]> = {};
  const orderQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const orderTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  discounts.forEach(discount => {
    const isEligible = discount.minimum_based_on === 'Quantity of Items'
      ? orderQuantity >= discount.minimum_qty_or_amount
      : orderTotal >= discount.minimum_qty_or_amount;

    if (!isEligible) return;

    items.forEach(item => {
      const appliesToProduct = discount.apply_on === 'Product'
        && !!item.erpProductId
        && discount.products.some(productId => String(productId) === item.erpProductId);
      const appliesToErpCategory = discount.apply_on === 'Category'
        && discount.categories.some(categoryId => item.erpCategoryIds?.includes(String(categoryId)));
      const appliesToEcommerceCategory = discount.apply_on_ecommerce === 'Category'
        && discount.ecommerce_categories.some(categoryId => item.categories?.includes(String(categoryId)));

      if (!appliesToProduct && !appliesToErpCategory && !appliesToEcommerceCategory) return;

      eligibleDiscounts[item.id] = [...(eligibleDiscounts[item.id] || []), discount];
    });
  });

  items.forEach(item => {
    const applicableDiscounts = eligibleDiscounts[item.id] || [];
    if (applicableDiscounts.length === 0) return;

    // Quantity/amount tiers are alternatives, not cumulative discounts.
    // Pick the single best eligible tier for this item.
    const bestDiscountPerUnit = applicableDiscounts.reduce((best, discount) => {
      const discountPerUnit = discount.type === 'Percentage'
        ? item.price * (discount.amount / 100)
        : discount.amount;

      return Math.max(best, Math.min(item.price, discountPerUnit));
    }, 0);

    itemDiscounts[item.id] = bestDiscountPerUnit * item.quantity;
  });

  return itemDiscounts;
};

export const calculateDiscountAmount = (items: CartItem[], discounts: Discount[]): number => {
  const itemDiscounts = calculateItemDiscounts(items, discounts);
  return Object.values(itemDiscounts).reduce((acc, val) => acc + val, 0);
};
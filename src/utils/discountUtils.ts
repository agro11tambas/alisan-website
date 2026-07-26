import { CartItem } from '@/types';
import { Discount } from '@/services/discountService';

export const calculateItemDiscounts = (items: CartItem[], discounts: Discount[]): Record<string, number> => {
  const itemDiscounts: Record<string, number> = {};
  if (!discounts || discounts.length === 0) return itemDiscounts;
  const eligibleDiscounts: Record<string, Discount[]> = {};
  
  const categoryQty: Record<string, number> = {};
  const categoryTotal: Record<string, number> = {};
  const ecommerceCategoryQty: Record<string, number> = {};
  const ecommerceCategoryTotal: Record<string, number> = {};
  const productQty: Record<string, number> = {};
  const productTotal: Record<string, number> = {};
  
  items.forEach(item => {
    if (item.erpProductId) {
      productQty[item.erpProductId] = (productQty[item.erpProductId] || 0) + item.quantity;
      productTotal[item.erpProductId] = (productTotal[item.erpProductId] || 0) + (item.price * item.quantity);
    }
    
    if (item.erpCategoryIds) {
      item.erpCategoryIds.forEach(catId => {
        categoryQty[catId] = (categoryQty[catId] || 0) + item.quantity;
        categoryTotal[catId] = (categoryTotal[catId] || 0) + (item.price * item.quantity);
      });
    }
    
    if (item.categories) {
      item.categories.forEach(catId => {
        ecommerceCategoryQty[catId] = (ecommerceCategoryQty[catId] || 0) + item.quantity;
        ecommerceCategoryTotal[catId] = (ecommerceCategoryTotal[catId] || 0) + (item.price * item.quantity);
      });
    }
  });
  
  discounts.forEach(discount => {
    const appliesToItemIds = new Set<string>();
    
    if (discount.apply_on === 'Product') {
      discount.products.forEach(pId => {
        const qty = productQty[String(pId)] || 0;
        const total = productTotal[String(pId)] || 0;
        const isEligible = discount.minimum_based_on === 'Quantity of Items' 
          ? qty >= discount.minimum_qty_or_amount
          : total >= discount.minimum_qty_or_amount;
        if (isEligible) {
          items.forEach(item => {
            if (item.erpProductId === String(pId)) appliesToItemIds.add(item.id);
          });
        }
      });
    } else if (discount.apply_on === 'Category') {
      discount.categories.forEach(cId => {
        const qty = categoryQty[String(cId)] || 0;
        const total = categoryTotal[String(cId)] || 0;
        const isEligible = discount.minimum_based_on === 'Quantity of Items' 
          ? qty >= discount.minimum_qty_or_amount
          : total >= discount.minimum_qty_or_amount;
        if (isEligible) {
          items.forEach(item => {
            if (item.erpCategoryIds?.includes(String(cId))) {
              appliesToItemIds.add(item.id);
            }
          });
        }
      });
    }

    if (discount.apply_on_ecommerce === 'Category') {
      discount.ecommerce_categories.forEach(cId => {
        const qty = ecommerceCategoryQty[String(cId)] || 0;
        const total = ecommerceCategoryTotal[String(cId)] || 0;
        const isEligible = discount.minimum_based_on === 'Quantity of Items' 
          ? qty >= discount.minimum_qty_or_amount
          : total >= discount.minimum_qty_or_amount;
        if (isEligible) {
          items.forEach(item => {
            if (item.categories?.includes(String(cId))) {
              appliesToItemIds.add(item.id);
            }
          });
        }
      });
    }
    
    appliesToItemIds.forEach(itemId => {
      eligibleDiscounts[itemId] = [...(eligibleDiscounts[itemId] || []), discount];
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

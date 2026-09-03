import { CartItem } from '@/types';
import { Discount } from '@/services/discountService';

/** Syarat "Apply On" yang bisa dinilai dari isi keranjang. */
const MATCHABLE_SCOPES = ['Product', 'Category', 'Mode'];

const scopesOf = (discount: Discount): string[] => {
  const raw = discount.apply_on_list?.length
    ? discount.apply_on_list
    : String(discount.apply_on || '').split(',');

  return raw.map(scope => scope.trim()).filter(scope => MATCHABLE_SCOPES.includes(scope));
};

/**
 * Apakah satu item memenuhi SEMUA syarat "Apply On" diskon ini.
 *
 * Sejak "Apply On" boleh lebih dari satu, syaratnya digabung DAN — diskon
 * "Category + Mode" hanya kena item yang kategorinya cocok DAN mode-nya cocok.
 * Harus sama persis dengan evaluator di ERP (DiscountScopeMatcher), karena
 * angka yang ditagih adalah hasil hitungan ERP.
 */
const matchesApplyOn = (discount: Discount, item: CartItem): boolean => {
  const scopes = scopesOf(discount);

  // Tidak ada syarat yang bisa dinilai — jangan diterapkan ke semua item.
  if (scopes.length === 0) return false;

  return scopes.every(scope => {
    if (scope === 'Product') {
      return !!item.erpProductId
        && discount.products.some(productId => String(productId) === item.erpProductId);
    }

    if (scope === 'Category') {
      return discount.categories.some(categoryId => item.erpCategoryIds?.includes(String(categoryId)));
    }

    if (scope === 'Mode') {
      return !!item.modeSlug
        && (discount.price_mode_slugs || []).includes(item.modeSlug);
    }

    return false;
  });
};

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
      // Target ecommerce adalah kolom tersendiri di luar `apply_on`, dan
      // hubungannya dengan `apply_on` tetap ATAU.
      const appliesToEcommerceCategory = discount.apply_on_ecommerce === 'Category'
        && discount.ecommerce_categories.some(categoryId => item.categories?.includes(String(categoryId)));

      if (!matchesApplyOn(discount, item) && !appliesToEcommerceCategory) return;

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
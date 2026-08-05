import { AddOnProduct, CartItem, Product, ProductGroup } from "@/types";

type ProductCombination = {
  id?: number | string;
  product_option_id?: number | string;
  lid_option_id?: number | string;
  image?: string;
};

type ProductGroupWithCombinations = ProductGroup & {
  _combinations?: ProductCombination[];
};

export const PRODUCT_IMAGE_PLACEHOLDER = "/image/Placeholder.jpg";

export function findProductCombination(
  group: ProductGroup,
  productId: string,
  lidId?: string,
  combinationId?: number,
) {
  const combinations = (group as ProductGroupWithCombinations)._combinations || [];

  return combinations.find((combination) => {
    if (combinationId !== undefined && String(combination.id) === String(combinationId)) {
      return true;
    }

    return Boolean(lidId)
      && String(combination.product_option_id) === String(productId)
      && String(combination.lid_option_id) === String(lidId);
  });
}

export function getSelectedProductImage(
  group: ProductGroup,
  product: Product,
  addOn?: AddOnProduct,
) {
  const combination = addOn
    ? findProductCombination(group, product.id, addOn.id)
    : undefined;

  return combination?.image
    || product.image
    || group.image
    || PRODUCT_IMAGE_PLACEHOLDER;
}

export function getCartItemImage(group: ProductGroup, item: CartItem) {
  const product = group.products.find((candidate) => String(candidate.id) === String(item.mainProductId));
  const combination = findProductCombination(
    group,
    item.mainProductId,
    item.addOnProductId,
    item.combinationId,
  );

  return combination?.image
    || product?.image
    || group.image
    || item.image
    || PRODUCT_IMAGE_PLACEHOLDER;
}

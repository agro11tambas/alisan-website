import { CartItem, ModePrice, Product, ProductGroup } from "@/types";

type ProductCombination = {
  id?: number | string;
  product_option_id?: number | string;
  lid_option_id?: number | string;
  image?: string;
  modePrices?: ModePrice[];
};

type ProductGroupWithCombinations = ProductGroup & {
  _combinations?: ProductCombination[];
};

/**
 * Cart yang tersimpan di server dibuat sebelum payload order memakai
 * `ecommerce_variant_combination_id` + `mode`, jadi item lama bisa datang tanpa
 * mode atau dengan combination id yang sudah tidak ada lagi di ERP. Item seperti
 * itu selalu ditolak backend saat checkout, jadi harus diperbaiki (atau dibuang)
 * sebelum masuk ke store.
 */
export function buildCartItemId(item: Pick<CartItem, "mainProductId" | "addOnProductId">, modeSlug: string) {
  return item.addOnProductId
    ? `bundle-${item.mainProductId}-${item.addOnProductId}-${modeSlug}`
    : `single-${item.mainProductId}-${modeSlug}`;
}

function modeSlugFromItemId(itemId: string) {
  const parts = itemId.split("-");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function availableModePrices(product: Product | undefined, combination: ProductCombination | undefined) {
  if (combination?.modePrices?.length) return combination.modePrices;
  return product?.modePrices || [];
}

function repairCartItem(item: CartItem, group: ProductGroup): CartItem | null {
  const combinations = (group as ProductGroupWithCombinations)._combinations || [];
  const product = group.products.find((candidate) => String(candidate.id) === String(item.mainProductId));

  if (!product) return null;

  const isBundle = Boolean(item.addOnProductId);
  let combination: ProductCombination | undefined;

  if (isBundle) {
    combination = combinations.find(
      (candidate) =>
        String(candidate.product_option_id) === String(item.mainProductId)
        && String(candidate.lid_option_id) === String(item.addOnProductId),
    );

    // Kombinasi varian + tutup ini sudah dihapus di ERP, tidak bisa dipesan lagi.
    if (!combination || combination.id === undefined || combination.id === null) return null;
  }

  const modePrices = availableModePrices(product, combination);
  const resolvedMode =
    modePrices.find((price) => price.slug === item.modeSlug)
    || modePrices.find((price) => price.slug === modeSlugFromItemId(item.id))
    || modePrices[0];

  // Produk tanpa daftar mode sama sekali tidak bisa dikirim ke endpoint order.
  if (!resolvedMode) return null;

  const combinationId = combination ? Number(combination.id) : undefined;
  const price = resolvedMode.slug === item.modeSlug ? item.price : resolvedMode.price;

  return {
    ...item,
    id: buildCartItemId(item, resolvedMode.slug),
    type: isBundle ? "bundle" : "single",
    combinationId,
    modeSlug: resolvedMode.slug,
    modeName: resolvedMode.name,
    price,
    mainPrice: product.modePrices?.find((mode) => mode.slug === resolvedMode.slug)?.price
      ?? product.salePrice
      ?? product.price,
  };
}

export function sanitizeCartItems(items: CartItem[], groups: ProductGroup[]) {
  // Perbaikan mode bisa membuat dua item lama jatuh ke id yang sama, jadi
  // digabung supaya kuantitasnya tidak hilang.
  const kept = new Map<string, CartItem>();
  const dropped: CartItem[] = [];

  const keep = (item: CartItem) => {
    const existing = kept.get(item.id);
    kept.set(
      item.id,
      existing ? { ...existing, quantity: existing.quantity + item.quantity } : item,
    );
  };

  items.forEach((item) => {
    const group = groups.find((candidate) =>
      (item.groupSlug && candidate.slug === item.groupSlug)
      || String(candidate.id) === String(item.productGroupId),
    );

    // Grup tidak ditemukan (mis. ERP sedang gagal dimuat) - biarkan apa adanya.
    if (!group) {
      keep(item);
      return;
    }

    const repaired = repairCartItem(item, group);

    if (!repaired) {
      dropped.push(item);
      return;
    }

    keep(repaired);
  });

  return { items: Array.from(kept.values()), dropped };
}

/** Item yang pasti ditolak backend saat membuat order. */
export function findUnorderableItems(items: CartItem[]) {
  return items.filter((item) => !item.modeSlug || (item.type === "bundle" && !item.combinationId));
}

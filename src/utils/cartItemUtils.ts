import { AddOnProduct, CartItem, ModePrice, Product, ProductGroup } from "@/types";

type ProductCombination = {
  id?: number | string;
  product_option_id?: number | string;
  lid_option_id?: number | string;
  image?: string;
  modePrices?: ModePrice[];
};

type ProductGroupWithCombinations = ProductGroup & {
  _combinations?: ProductCombination[];
  _lids?: AddOnProduct[];
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

/**
 * Backend menolak qty yang di bawah `min_qty`, di atas `max_qty`, atau bukan
 * kelipatan `multiple_qty` (dihitung dari 0, bukan dari min). Tombol +/- di
 * keranjang bisa menghasilkan angka di luar aturan itu kalau min bukan
 * kelipatan step, jadi setiap perubahan qty dilewatkan ke sini dulu.
 */
export function normalizeQuantity(quantity: number, minOrder: number, orderStep: number, stock: number): number {
  const step = Math.max(Math.floor(orderStep) || 1, 1);
  const min = Math.max(Math.floor(minOrder) || 1, 1);
  const max = stock > 0 ? Math.floor(stock) : Infinity;

  const roundedUp = Math.ceil(Math.max(Math.floor(quantity) || min, min) / step) * step;

  if (roundedUp <= max) return roundedUp;

  const roundedDown = Math.floor(max / step) * step;

  // Stok tidak menyisakan kelipatan yang memenuhi minimum - biarkan di minimum
  // valid supaya pesannya datang dari backend, bukan diam-diam salah.
  return roundedDown >= min ? roundedDown : Math.ceil(min / step) * step;
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
  const addOn = isBundle
    ? ((group as ProductGroupWithCombinations)._lids || [])
      .find((candidate) => String(candidate.id) === String(item.addOnProductId))
    : undefined;
  const refreshedStock = addOn ? Math.min(product.stock, addOn.stock) : product.stock;
  const refreshedMinOrder = product.minimumOrder || 1;
  const refreshedOrderStep = product.orderStep || 1;

  return {
    ...item,
    id: buildCartItemId(item, resolvedMode.slug),
    type: isBundle ? "bundle" : "single",
    combinationId,
    variantOptionId: product.isVariantOption === false ? undefined : product.id,
    modeSlug: resolvedMode.slug,
    modeName: resolvedMode.name,
    // Harga & batas qty selalu diambil ulang dari ERP: nilai yang tersimpan di
    // cart bisa sudah basi, dan backend menghitung ulang totalnya sendiri saat
    // checkout (atau menolak qty yang tidak lagi memenuhi min/kelipatan/maks).
    price: resolvedMode.price,
    mainPrice: product.modePrices?.find((mode) => mode.slug === resolvedMode.slug)?.price
      ?? product.salePrice
      ?? product.price,
    stock: refreshedStock,
    minOrder: refreshedMinOrder,
    orderStep: refreshedOrderStep,
    quantity: normalizeQuantity(item.quantity, refreshedMinOrder, refreshedOrderStep, refreshedStock),
    unitName: group.unitName || "Pcs",
  };
}

export function sanitizeCartItems(items: CartItem[], groups: ProductGroup[]) {
  // Perbaikan mode bisa membuat dua item lama jatuh ke id yang sama, jadi
  // digabung supaya kuantitasnya tidak hilang.
  const kept = new Map<string, CartItem>();
  const dropped: CartItem[] = [];

  const keep = (item: CartItem) => {
    const existing = kept.get(item.id);

    if (!existing) {
      kept.set(item.id, item);
      return;
    }

    kept.set(item.id, {
      ...existing,
      quantity: normalizeQuantity(
        existing.quantity + item.quantity,
        existing.minOrder,
        existing.orderStep,
        existing.stock,
      ),
    });
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

/**
 * Id variant option untuk payload order. Item baru menyimpannya eksplisit;
 * item lama hanya punya `mainProductId`, yang berisi id variant option kecuali
 * grupnya memang tidak bervarian (di situ id-nya sama dengan id ecommerce
 * product). Perbandingan id itu cuma tebakan untuk data lama - jangan dipakai
 * lagi untuk item yang sudah punya `variantOptionId`.
 */
export function resolveVariantOptionId(item: CartItem): number | undefined {
  if (item.combinationId) return undefined;

  if (item.variantOptionId !== undefined) return Number(item.variantOptionId);

  return String(item.mainProductId) !== String(item.productGroupId)
    ? Number(item.mainProductId)
    : undefined;
}

/** Item yang pasti ditolak backend saat membuat order. */
export function findUnorderableItems(items: CartItem[]) {
  return items.filter((item) => !item.modeSlug || (item.type === "bundle" && !item.combinationId));
}

import axios from "axios";
import { api } from "./api";
import { ProductGroup, AddOnProduct, Product, ModePrice } from "@/types";
import { cache } from "react";

const getCatalog = async (url: string) => {
  try {
    return await api.get(url);
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 503) {
      throw error;
    }

    // Backend memakai 503 singkat saat cache benar-benar dingin dan hanya satu
    // worker sedang memanaskannya. Coba sekali lagi; jangan ubah kegagalan ini
    // menjadi katalog kosong yang kemudian disimpan ISR selama beberapa menit.
    const retryAfter = Number(error.response.headers["retry-after"] || 1);
    const retrySeconds = Number.isFinite(retryAfter) ? retryAfter : 1;
    const waitMs = Math.min(Math.max(retrySeconds, 1), 5) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));

    return api.get(url);
  }
};

const mapModePrices = (prices: any[] = []): ModePrice[] => prices.map((price: any) => ({
  priceModeId: Number(price.price_mode_id),
  slug: String(price.slug),
  name: String(price.name),
  fixedCost: Number(price.fixed_cost || 0),
  margin: Number(price.margin || 0),
  price: Number(price.price || 0),
}));

const firstImageUrl = (...candidates: unknown[]): string | undefined => {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return undefined;
};

const mapBackendToFrontend = (apiData: any[]): ProductGroup[] => {
  return apiData.map((ecProduct: any) => {
    let products: Product[] = [];
    let addOns: AddOnProduct[] = [];

    const productOptionGroup = ecProduct.variant_groups?.[0];
    const lidOptionGroup = ecProduct.variant_groups?.[1];

    // ERP's appended attributes contain public URLs; `main_image` can still
    // contain a storage path, so it is only a final fallback.
    const imageUrl = firstImageUrl(ecProduct.image, ecProduct.image_url, ecProduct.main_image)
      || "/image/Placeholder.jpg";

    if (productOptionGroup && productOptionGroup.options) {
      products = productOptionGroup.options.map((opt: any) => {
        const erpProd = opt.product || {};
        return {
          id: String(opt.id),
          name: opt.alias || erpProd.name || ecProduct.title,
          sku: erpProd.sku || "",
          price: Number(opt.original_price || opt.price || erpProd.price || 0),
          salePrice: (opt.original_price && Number(opt.price) < Number(opt.original_price)) ? Number(opt.price) : (Number(erpProd.sale_price) > 0 ? Number(erpProd.sale_price) : undefined),
          stock: Number(ecProduct.max_qty || 1000),
          optionName: opt.alias || erpProd.name,
          minimumOrder: Number(ecProduct.min_qty || 1),
          orderStep: Number(ecProduct.multiple_qty || 1),
          // No group-image fallback: an option without its own photo must show
          // no thumbnail rather than the whole product's photo.
          image: firstImageUrl(
            opt.image_url,
            opt.image,
            erpProd.image_url,
            erpProd.image,
            erpProd.thumbnail_url,
            erpProd.thumbnail,
          ),
          erpProductId: opt.erp_product_id ? String(opt.erp_product_id) : undefined,
          allowWithoutLid: Boolean(opt.allow_without_lid ?? true),
          erpCategoryIds: opt.erp_category_ids ? opt.erp_category_ids.map(String) : [],
          modePrices: mapModePrices(opt.mode_prices),
        };
      });
    } else {
      products = [{
        id: String(ecProduct.id),
        name: ecProduct.title,
        sku: "SKU-" + ecProduct.id,
        price: Number(ecProduct.price || 0),
        stock: Number(ecProduct.max_qty || 1000),
        minimumOrder: Number(ecProduct.min_qty || 1),
        orderStep: Number(ecProduct.multiple_qty || 1),
        image: imageUrl,
      }];
    }

    if (lidOptionGroup && lidOptionGroup.options) {
      addOns = lidOptionGroup.options.map((opt: any) => {
        const erpProd = opt.product || {};
        return {
          id: String(opt.id),
          name: opt.alias || erpProd.name,
          sku: erpProd.sku || "",
          price: Number(opt.original_price || opt.price || erpProd.price || 0),
          salePrice: (opt.original_price && Number(opt.price) < Number(opt.original_price)) ? Number(opt.price) : (Number(erpProd.sale_price) > 0 ? Number(erpProd.sale_price) : undefined),
          stock: Number(ecProduct.max_qty || 1000),
          image: firstImageUrl(
            opt.image_url,
            opt.image,
            erpProd.image_url,
            erpProd.image,
            erpProd.thumbnail_url,
            erpProd.thumbnail,
          ),
          erpProductId: opt.erp_product_id ? String(opt.erp_product_id) : undefined,
          erpCategoryIds: opt.erp_category_ids ? opt.erp_category_ids.map(String) : [],
          modePrices: mapModePrices(opt.mode_prices),
        };
      });
    }

    const combinations = ecProduct.variant_combinations?.map((comb: any) => ({
      ...comb,
      price: Number(comb.original_price || comb.price || 0),
      salePrice: comb.sale_price ? Number(comb.sale_price) : ((comb.original_price && Number(comb.price) < Number(comb.original_price)) ? Number(comb.price) : undefined),
      image: firstImageUrl(comb.image_url, comb.image),
      modePrices: mapModePrices(comb.mode_prices),
    })) || [];

    const gallery = (ecProduct.gallery_images || [])
      .map((galleryImage: any) => firstImageUrl(
        galleryImage?.image_url,
        galleryImage?.url,
        galleryImage?.image,
        galleryImage,
      ))
      .filter((galleryImage: string | undefined): galleryImage is string => Boolean(galleryImage));

    return {
      id: String(ecProduct.id),
      name: ecProduct.title,
      slug: ecProduct.slug,
      description: ecProduct.description,
      category: ecProduct.categories?.length > 0 ? String(ecProduct.categories[0].id) : "",
      categories: ecProduct.categories?.map((c: any) => String(c.id)) || [],
      rating: 5.0,
      totalSold: 0,
      image: imageUrl,
      gallery: gallery.length > 0 ? gallery : [imageUrl],
      productGroupName: productOptionGroup?.name || "Opsi Produk",
      lidGroupName: lidOptionGroup?.name || "Opsi Tutup",
      unitName: ecProduct.unit?.name || "Pcs",
      products,
      _lids: addOns,
      _combinations: combinations,
    } as ProductGroup & { _lids?: AddOnProduct[], _combinations?: any[] };
  });
};

const fetchAllProductGroups = cache(async (): Promise<ProductGroup[]> => {
  try {
    const response = await getCatalog("/ecommerce/products");
    if (response.data?.success && response.data?.data) {
      return mapBackendToFrontend(response.data.data);
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
});

const fetchProductGroupBySlug = cache(
  async (slug: string): Promise<ProductGroup | undefined> => {
    try {
      const response = await getCatalog(`/ecommerce/products/${slug}`);
      if (response.data?.success && response.data?.data) {
        const mapped = mapBackendToFrontend([response.data.data]);
        return mapped[0];
      }
      return undefined;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }

      console.error("Error fetching product by slug:", error);
      throw error;
    }
  },
);

export const productService = {
  getAvailableLids: async (): Promise<AddOnProduct[]> => {
    try {
      const groups = await fetchAllProductGroups();
      const allLids: AddOnProduct[] = [];
      const seenIds = new Set();
      groups.forEach((g: any) => {
        if (g._lids) {
          g._lids.forEach((lid: AddOnProduct) => {
            if (!seenIds.has(lid.id)) {
              seenIds.add(lid.id);
              allLids.push(lid);
            }
          });
        }
      });
      return allLids;
    } catch (error) {
      console.error("Error fetching lids:", error);
      return [];
    }
  },

  getProductGroups: async (options?: {
    categoryId?: string;
    search?: string;
    limit?: number;
  }): Promise<ProductGroup[]> => {
    let filtered = await fetchAllProductGroups();

    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.category === options.categoryId || (p.categories && p.categories.includes(options.categoryId!)));
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  },

  getProductGroupById: async (
    id: string,
  ): Promise<ProductGroup | undefined> => {
    const groups = await productService.getProductGroups();
    return groups.find((p) => p.id === id);
  },

  getProductGroupBySlug: async (
    slug: string,
  ): Promise<ProductGroup | undefined> => {
    return fetchProductGroupBySlug(slug);
  },

  getRelatedProductGroups: async (
    groupId: string,
    limit: number = 4,
    prefetchedGroups?: ProductGroup[],
  ): Promise<ProductGroup[]> => {
    const groups = prefetchedGroups ?? await productService.getProductGroups();
    const group = groups.find((p) => p.id === groupId);
    if (!group) return [];

    return groups.filter(
      (p) => p.id !== groupId && (p.category === group.category || (p.categories && group.categories && p.categories.some(c => group.categories!.includes(c)))),
    ).slice(0, limit);
  },
};

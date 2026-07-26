import { api } from "./api";
import { ProductGroup, AddOnProduct, Product } from "@/types";

const mapBackendToFrontend = (apiData: any[]): ProductGroup[] => {
  return apiData.map((ecProduct: any) => {
    let products: Product[] = [];
    let addOns: AddOnProduct[] = [];

    const productOptionGroup = ecProduct.variant_groups?.[0];
    const lidOptionGroup = ecProduct.variant_groups?.[1];

    // Use main_image from backend, fallback to placeholder
    const imageUrl = ecProduct.main_image || "/image/Placeholder.jpg";

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
          image: opt.image || imageUrl,
          erpProductId: opt.erp_product_id ? String(opt.erp_product_id) : undefined,
          erpCategoryIds: opt.erp_category_ids ? opt.erp_category_ids.map(String) : [],
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
          image: opt.image || imageUrl,
          erpProductId: opt.erp_product_id ? String(opt.erp_product_id) : undefined,
          erpCategoryIds: opt.erp_category_ids ? opt.erp_category_ids.map(String) : [],
        };
      });
    }

    const combinations = ecProduct.variant_combinations?.map((comb: any) => ({
      ...comb,
      price: Number(comb.original_price || comb.price || 0),
      salePrice: comb.sale_price ? Number(comb.sale_price) : ((comb.original_price && Number(comb.price) < Number(comb.original_price)) ? Number(comb.price) : undefined),
    })) || [];

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
      gallery: ecProduct.gallery_images?.length > 0 
        ? ecProduct.gallery_images.map((g: any) => g.image_url) 
        : (ecProduct.main_image ? [ecProduct.main_image] : ["/image/Placeholder.jpg"]),
      productGroupName: productOptionGroup?.name || "Opsi Produk",
      lidGroupName: lidOptionGroup?.name || "Opsi Tutup",
      unitName: ecProduct.unit?.name || "Pcs",
      products,
      _lids: addOns,
      _combinations: combinations,
    } as ProductGroup & { _lids?: AddOnProduct[], _combinations?: any[] };
  });
};

const fetchAllProductGroups = async (): Promise<ProductGroup[]> => {
  try {
    const response = await api.get("/ecommerce/products");
    if (response.data?.success && response.data?.data) {
      return mapBackendToFrontend(response.data.data);
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

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
    try {
      const response = await api.get(`/ecommerce/products/${slug}`);
      if (response.data?.success && response.data?.data) {
        const mapped = mapBackendToFrontend([response.data.data]);
        return mapped[0];
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching product by slug:", error);
      return undefined;
    }
  },

  getRelatedProductGroups: async (
    groupId: string,
    limit: number = 4,
  ): Promise<ProductGroup[]> => {
    const groups = await productService.getProductGroups();
    const group = groups.find((p) => p.id === groupId);
    if (!group) return [];

    return groups.filter(
      (p) => p.id !== groupId && (p.category === group.category || (p.categories && group.categories && p.categories.some(c => group.categories!.includes(c)))),
    ).slice(0, limit);
  },
};

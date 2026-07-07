import { api } from "./api";
import { Category } from "@/types";

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get("/ecommerce/categories");
    if (response.data?.success && response.data?.data) {
      return response.data.data.map((c: any) => ({
        id: String(c.id),
        name: c.name,
        slug: c.slug,
        image: c.image || "/image/Placeholder.jpg",
        icon: c.icon,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    return fetchCategories();
  },

  getCategoryBySlug: async (slug: string): Promise<Category | undefined> => {
    const categories = await categoryService.getCategories();
    return categories.find((c) => c.slug === slug);
  },
};

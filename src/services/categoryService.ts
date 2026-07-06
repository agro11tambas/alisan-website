import { Category } from "@/types";

const MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Sablon", slug: "sablon", image: "/image/Placeholder.jpg" },
  {
    id: "c2",
    name: "Plastik",
    slug: "plastik",
    image: "/image/Placeholder.jpg",
  },
  { id: "c3", name: "Cup", slug: "cup", image: "/image/Placeholder.jpg" },
  {
    id: "c4",
    name: "Tutup Cup",
    slug: "tutup-cup",
    image: "/image/Placeholder.jpg",
  },
];

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_CATEGORIES;
  },

  getCategoryBySlug: async (slug: string): Promise<Category | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_CATEGORIES.find((c) => c.slug === slug);
  },
};

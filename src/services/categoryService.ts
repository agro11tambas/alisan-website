import { api } from "./api";
import { Category } from "@/types";

type FlatCategory = Omit<Category, "children"> & { children: Category[] };

const byOrderThenName = (a: Category, b: Category) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/**
 * The ERP returns every category in a single flat list, parents and children
 * alike, related through `parent_id`. Children are nested here so the UI can
 * render the hierarchy without re-deriving it on every page.
 */
const buildTree = (flat: FlatCategory[]): FlatCategory[] => {
  const byId = new Map(flat.map((c) => [c.id, c]));

  flat.forEach((category) => {
    if (!category.parentId) return;
    const parent = byId.get(category.parentId);
    // An orphaned child (parent inactive or missing) is promoted to a root so
    // it never disappears from the storefront.
    if (parent) parent.children.push(category);
    else category.parentId = undefined;
  });

  flat.forEach((category) => category.children.sort(byOrderThenName));

  return flat.sort(byOrderThenName);
};

const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get("/ecommerce/categories");
    if (response.data?.success && response.data?.data) {
      const flat: FlatCategory[] = response.data.data
        .filter((c: any) => c.is_active !== false)
        .map((c: any) => ({
          id: String(c.id),
          name: c.name,
          slug: c.slug,
          image: c.image_url || c.image || "/image/Placeholder.jpg",
          icon: c.icon,
          description: c.description || undefined,
          parentId: c.parent_id != null ? String(c.parent_id) : undefined,
          sortOrder: Number(c.sort_order || 0),
          children: [],
        }));

      return buildTree(flat);
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const categoryService = {
  /** Every category, flat, each parent carrying its nested `children`. */
  getCategories: async (): Promise<Category[]> => {
    return fetchCategories();
  },

  /** Only top-level categories, each carrying its nested `children`. */
  getCategoryTree: async (): Promise<Category[]> => {
    const categories = await fetchCategories();
    return categories.filter((c) => !c.parentId);
  },

  getCategoryBySlug: async (slug: string): Promise<Category | undefined> => {
    const categories = await fetchCategories();
    return categories.find((c) => c.slug === slug);
  },
};

/** A category id plus every id below it, so a parent also matches its children. */
export const collectCategoryIds = (category: Category): string[] => [
  category.id,
  ...category.children.flatMap(collectCategoryIds),
];

/** Walks up to the root so a selected child can show its ancestry. */
export const getCategoryAncestors = (
  category: Category,
  categories: Category[],
): Category[] => {
  const ancestors: Category[] = [];
  let current = category;

  while (current.parentId) {
    const parent = categories.find((c) => c.id === current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
};

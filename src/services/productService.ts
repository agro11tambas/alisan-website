import { ProductGroup, AddOnProduct } from "@/types";

export const MOCK_LID_PRODUCTS: AddOnProduct[] = [
  {
    id: "l1",
    name: "Tutup PET Strawless PLP 92.5",
    sku: "TPS-PLP-925",
    price: 150,
    stock: 10000,
    image: "https://placehold.co/600x600/f0f8ff/000000.png?text=Lid+PLP",
  },
  {
    id: "l2",
    name: "Tutup PET Strawless Starindo 92.5",
    sku: "TPS-ST-925",
    price: 170,
    stock: 8000,
    image: "https://placehold.co/600x600/f0fff0/000000.png?text=Lid+Starindo",
  },
  {
    id: "l3",
    name: "Tutup PET Flat 92.5",
    sku: "TPF-925",
    price: 130,
    stock: 15000,
    image: "https://placehold.co/600x600/fff0f5/000000.png?text=Lid+Flat",
  },
  {
    id: "l4",
    name: "Tutup PET Dome 92.5",
    sku: "TPD-925",
    price: 140,
    stock: 12000,
    image: "https://placehold.co/600x600/fffff0/000000.png?text=Lid+Dome",
  },
];

export const MOCK_PRODUCT_GROUPS: ProductGroup[] = [
  {
    id: "pg1",
    name: "Glassindo Cup",
    slug: "glassindo-cup",
    description:
      "High-quality clear plastic oval cups ideal for iced coffee, boba, and smoothies.",
    brand: "Glassindo",
    category: "c3", // Cup
    rating: 4.9,
    totalSold: 15400,
    image: "https://placehold.co/600x600/e6e6fa/000000.png?text=Glassindo+Group",
    gallery: [
      "https://placehold.co/600x600/e6e6fa/000000.png?text=Glassindo+Group",
      "https://placehold.co/600x600/e6e6fa/000000.png?text=Glassindo+Group+2"
    ],
    products: [
      {
        id: "p1",
        name: "Glassindo 12 oz Oval 7gr",
        optionName: "12 oz Oval 7gr",
        sku: "gl12o7",
        price: 15000,
        stock: 15000,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=12oz+7gr",
        gallery: ["https://placehold.co/600x600/e6e6fa/000000.png?text=12oz+7gr"]
      },
      {
        id: "p2",
        name: "Glassindo 12 oz Oval 8gr",
        optionName: "12 oz Oval 8gr",
        sku: "gl12o8",
        price: 16500,
        stock: 12000,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=12oz+8gr",
        gallery: ["https://placehold.co/600x600/e6e6fa/000000.png?text=12oz+8gr"]
      },
      {
        id: "p3",
        name: "Glassindo 14 oz Oval 7gr",
        optionName: "14 oz Oval 7gr",
        sku: "gl14o7",
        price: 17000,
        stock: 20000,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=14oz+7gr",
        gallery: ["https://placehold.co/600x600/e6e6fa/000000.png?text=14oz+7gr"]
      },
      {
        id: "p4",
        name: "Glassindo 14 oz Oval 8gr",
        optionName: "14 oz Oval 8gr",
        sku: "gl14o8",
        price: 18500,
        stock: 0,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=14oz+8gr",
        gallery: ["https://placehold.co/600x600/e6e6fa/000000.png?text=14oz+8gr"]
      },
      {
        id: "p5",
        name: "Glassindo 16 oz Oval 7gr",
        optionName: "16 oz Oval 7gr",
        sku: "gl16o7",
        price: 19000,
        stock: 8000,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=16oz+7gr",
        gallery: [
          "https://placehold.co/600x600/e6e6fa/000000.png?text=16oz+7gr",
          "https://placehold.co/600x600/e6e6fa/000000.png?text=16oz+7gr+Angle"
        ]
      },
      {
        id: "p6",
        name: "Glassindo 16 oz Oval 8gr",
        optionName: "16 oz Oval 8gr",
        sku: "gl16o8",
        price: 21000,
        stock: 4500,
        minimumOrder: 500,
        orderStep: 500,
        image: "https://placehold.co/600x600/e6e6fa/000000.png?text=16oz+8gr",
        gallery: ["https://placehold.co/600x600/e6e6fa/000000.png?text=16oz+8gr"]
      },
    ],
  },
  {
    id: "pg2",
    name: "Sablon Cup Custom",
    slug: "sablon-cup-custom",
    description:
      "Custom printing for your plastic cups. Build your brand identity.",
    brand: "Alisan",
    category: "c1", // Sablon
    rating: 5.0,
    totalSold: 8200,
    image: "/image/Placeholder.jpg",
    gallery: ["/image/Placeholder.jpg"],
    products: [
      {
        id: "p11",
        name: "Sablon Cup 1 Warna",
        optionName: "1 Warna",
        sku: "sc1w",
        price: 200,
        stock: 50000,
        minimumOrder: 1000,
        orderStep: 500,
      },
      {
        id: "p12",
        name: "Sablon Cup 2 Warna",
        optionName: "2 Warna",
        sku: "sc2w",
        price: 350,
        stock: 50000,
        minimumOrder: 1000,
        orderStep: 500,
      },
    ],
  },
  {
    id: "pg3",
    name: "Tutup Cup Plastik",
    slug: "tutup-cup-plastik",
    description: "Secure flat and dome lids for all standard sizes.",
    brand: "Glassindo",
    category: "c4", // Tutup Cup
    rating: 4.8,
    totalSold: 21000,
    image: "/image/Placeholder.jpg",
    gallery: ["/image/Placeholder.jpg"],
    products: [
      {
        id: "p21",
        name: "Tutup Datar (Flat Lid)",
        optionName: "Flat Lid",
        sku: "tlflat",
        price: 5000,
        stock: 50000,
        minimumOrder: 500,
        orderStep: 500,
      },
      {
        id: "p22",
        name: "Tutup Cembung (Dome Lid)",
        optionName: "Dome Lid",
        sku: "tldome",
        price: 6500,
        stock: 30000,
        minimumOrder: 500,
        orderStep: 500,
      },
    ],
  },
  {
    id: "pg4",
    name: "Paper Cup",
    slug: "paper-cup",
    description:
      "Eco-friendly paper cups with strong double-wall insulation. Perfect for hot coffee.",
    brand: "EcoPack",
    category: "c5", // Paper Cup
    rating: 4.7,
    totalSold: 8900,
    image: "/image/Placeholder.jpg",
    products: [
      {
        id: "p31",
        name: "Paper Cup 8 oz Single Wall",
        optionName: "8 oz Single Wall",
        sku: "pc8sw",
        price: 12000,
        stock: 5000,
        minimumOrder: 500,
        orderStep: 500,
      },
      {
        id: "p32",
        name: "Paper Cup 8 oz Double Wall",
        optionName: "8 oz Double Wall",
        sku: "pc8dw",
        price: 25000,
        stock: 2000,
        minimumOrder: 500,
        orderStep: 500,
      },
    ],
  },
  {
    id: "pg5",
    name: "Sedotan Plastik",
    slug: "sedotan-plastik",
    description: "High quality individually wrapped plastic straws.",
    brand: "Alisan",
    category: "c7", // Sedotan
    rating: 4.9,
    totalSold: 32000,
    image: "/image/Placeholder.jpg",
    products: [
      {
        id: "p41",
        name: "Sedotan Steril 6mm",
        optionName: "6mm",
        sku: "st6",
        price: 8000,
        stock: 15000,
        minimumOrder: 1000,
        orderStep: 1000,
      },
      {
        id: "p42",
        name: "Sedotan Boba 12mm",
        optionName: "12mm (Boba)",
        sku: "st12",
        price: 15000,
        stock: 8000,
        minimumOrder: 1000,
        orderStep: 1000,
      },
    ],
  },
  {
    id: "pg6",
    name: "Food Container",
    slug: "food-container",
    description: "Microwave-safe plastic food containers with tight lids.",
    brand: "KlipPlast",
    category: "c6", // Food Container
    rating: 4.8,
    totalSold: 12400,
    image: "/image/Placeholder.jpg",
    products: [
      {
        id: "p51",
        name: "Thinwall 500ml",
        optionName: "500ml",
        sku: "tw500",
        price: 22000,
        stock: 4000,
        minimumOrder: 50,
        orderStep: 50,
      },
      {
        id: "p52",
        name: "Thinwall 750ml",
        optionName: "750ml",
        sku: "tw750",
        price: 26000,
        stock: 3500,
        minimumOrder: 50,
        orderStep: 50,
      },
    ],
  },
  {
    id: "pg7",
    name: "Paper Bag",
    slug: "paper-bag",
    description: "Sturdy kraft paper bags for premium packaging.",
    brand: "EcoPack",
    category: "c8", // Paper Bag
    rating: 4.6,
    totalSold: 6700,
    image: "/image/Placeholder.jpg",
    products: [
      {
        id: "p61",
        name: "Paper Bag Small",
        optionName: "Small",
        sku: "pbsm",
        price: 15000,
        stock: 6000,
        minimumOrder: 100,
        orderStep: 100,
      },
      {
        id: "p62",
        name: "Paper Bag Medium",
        optionName: "Medium",
        sku: "pbmd",
        price: 20000,
        stock: 4500,
        minimumOrder: 100,
        orderStep: 100,
      },
    ],
  },
  {
    id: "pg8",
    name: "Plastik Kemasan",
    slug: "plastik-kemasan",
    description: "Clear plastic bags (PE/PP) for general packaging needs.",
    brand: "Alisan",
    category: "c2", // Plastik
    rating: 4.9,
    totalSold: 41000,
    image: "/image/Placeholder.jpg",
    products: [
      {
        id: "p71",
        name: "Plastik PP 10x20",
        optionName: "10x20",
        sku: "pp10",
        price: 12000,
        stock: 8000,
        minimumOrder: 100,
        orderStep: 100,
      },
      {
        id: "p72",
        name: "Plastik PE 15x30",
        optionName: "15x30",
        sku: "pe15",
        price: 18000,
        stock: 6000,
        minimumOrder: 100,
        orderStep: 100,
      },
    ],
  },
];

export const productService = {
  getAvailableLids: async (): Promise<AddOnProduct[]> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_LID_PRODUCTS;
  },

  getProductGroups: async (options?: {
    categoryId?: string;
    search?: string;
    limit?: number;
  }): Promise<ProductGroup[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    let filtered = [...MOCK_PRODUCT_GROUPS];

    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.category === options.categoryId);
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
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_PRODUCT_GROUPS.find((p) => p.id === id);
  },

  getProductGroupBySlug: async (
    slug: string,
  ): Promise<ProductGroup | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_PRODUCT_GROUPS.find((p) => p.slug === slug);
  },

  getRelatedProductGroups: async (
    groupId: string,
    limit: number = 4,
  ): Promise<ProductGroup[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const group = MOCK_PRODUCT_GROUPS.find((p) => p.id === groupId);
    if (!group) return [];

    return MOCK_PRODUCT_GROUPS.filter(
      (p) => p.id !== groupId && p.category === group.category,
    ).slice(0, limit);
  },
};

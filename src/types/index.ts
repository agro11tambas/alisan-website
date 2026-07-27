export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  icon?: string;
}

export type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  gallery?: string[];
  allowWithoutLid?: boolean;
  description?: string;
  optionName?: string;
  minimumOrder: number;
  orderStep: number;
  erpProductId?: string;
  erpCategoryIds?: string[];
};

export type AddOnProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  gallery?: string[];
  erpProductId?: string;
  erpCategoryIds?: string[];
};

export type ProductGroup = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  gallery?: string[];
  brand?: string;
  category: string;
  categories?: string[];
  rating: number;
  totalSold: number;
  productGroupName?: string;
  lidGroupName?: string;
  unitName?: string;
  products: Product[];
};

export type CartItem = {
  id: string;
  type: "single" | "bundle";

  productGroupId?: string;
  groupName?: string;
  groupSlug?: string;

  mainProductId: string;
  mainProductName: string;
  mainSku: string;
  mainPrice: number;

  addOnProductId?: string;
  addOnProductName?: string;
  addOnSku?: string;
  addOnPrice?: number;

  displayName: string;
  price: number;
  quantity: number;
  image?: string;
  stock: number;
  minOrder: number;
  orderStep: number;
  unitName?: string;
  combinationId?: number;
  categories?: string[];
  erpProductId?: string;
  erpCategoryIds?: string[];
  isSelected?: boolean;
};

export interface Address {
  id: string | number;
  customer_id?: number;
  business_name?: string;
  businessName?: string;
  address?: string;
  completeAddress?: string;
  google_maps?: string;
  googleMapsLink?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface BusinessProfile {
  id: number;
  name: string;
  phone: string;
  email?: string;
  addresses?: Address[];
}

export interface Customer {
  id?: string | number;
  name?: string;
  fullName?: string;
  email: string;
  whatsapp_number?: string;
  whatsappNumber?: string;
  address?: string;
  customer_id?: number;
  customers?: BusinessProfile[];
}

export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
}

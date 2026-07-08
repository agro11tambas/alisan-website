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
  description?: string;
  optionName?: string;
  minimumOrder: number;
  orderStep: number;
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
  products: Product[];
};

export type CartItem = {
  id: string;
  type: "single" | "bundle";

  productGroupId?: string;
  groupName?: string;

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
  combinationId?: number;
};

export interface Address {
  id: string;
  businessName?: string;
  completeAddress: string;
  googleMapsLink?: string;
  isDefault: boolean;
}

export interface Customer {
  id?: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  address: string;
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

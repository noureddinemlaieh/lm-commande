import { Product } from './Product';

export interface ServiceMaterial {
  id: string;
  serviceId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  quantity?: number;
  unit?: string;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit?: string;
    reference?: string;
  }>;
  product?: Product;
  productId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  catalogId: string;
  services: Service[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogService {
  id: string;
  name: string;
  description?: string;
  price: number;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
    reference?: string;
  }>;
}

export interface Catalog {
  id: string;
  name: string;
  description?: string | null;
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  catalogId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  cost: number;
  sellingPrice: number;
  category: 'SERVICE' | 'MATERIAL';
  reference?: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  reference?: string;
  toChoose?: boolean;
  serviceId: string;
  quantity: number;
  unit: string;
  price: number;
  sellingPrice?: number;
} 
export type ProductCategory = 'MATERIAL' | 'SERVICE';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  cost: number;
  sellingPrice: number;
  category: ProductCategory;
  createdAt: Date;
  updatedAt: Date;
  reference: string | null;
  buyingPrice?: number;
  stock?: number;
} 
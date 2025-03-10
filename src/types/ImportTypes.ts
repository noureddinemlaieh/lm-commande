/**
 * Types pour l'importation des données
 */

// Type pour les données brutes importées depuis Excel
export interface RawExcelProductData {
  name: unknown;
  description: unknown;
  category: unknown;
  cost: unknown;
  unit: unknown;
  reference: unknown;
  sellingPrice: unknown;
}

// Type pour les données validées après conversion
export interface ValidatedProductData {
  name: string;
  description: string | null;
  category: 'SERVICE' | 'MATERIAL';
  cost: number;
  unit: string | null;
  reference: string | null;
  sellingPrice: number;
}

// Type pour les résultats d'importation
export interface ImportResult {
  success: number;
  errors: string[];
  total: number;
  createdProducts: any[];
}

// Type pour les données de catalogue importées
export interface ImportedCatalogData {
  name: string;
  description?: string;
  categories: ImportedCategoryData[];
}

export interface ImportedCategoryData {
  name: string;
  order?: number;
  services: ImportedServiceData[];
}

export interface ImportedServiceData {
  name: string;
  description?: string | null;
  price: number;
  quantity?: number;
  unit?: string | null;
  order?: number;
  materials: ImportedMaterialData[];
}

export interface ImportedMaterialData {
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string | null;
  toChoose?: boolean;
} 
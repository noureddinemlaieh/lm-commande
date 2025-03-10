export interface CatalogueItem {
    id: number;
    name: string;
    price: number;
}

export interface CatalogueService {
    id: number;
    name: string;
    price: number;
}

export interface Catalogue {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
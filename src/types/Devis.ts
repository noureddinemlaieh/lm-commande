import type { Client } from './Client';

export interface DevisMaterial {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DevisService {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit?: string;
  order: number;
  materials: DevisMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DevisSection {
  id: string;
  name: string;
  materialsTotal: number;
  subTotal: number;
  services: DevisService[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Devis {
  id: string;
  number: number;
  year: number;
  reference: string;
  status: string;
  client?: Client;        // Relation avec le client
  clientId?: string;       // ID du client associé
  sections: DevisSection[];
  createdAt: Date;
  updatedAt: Date;
  devisComments?: string;
  showDevisComments?: boolean;
  orderFormComments?: string;
  showOrderFormComments?: boolean;
  showDescriptions?: boolean;
}

export interface DevisStatusHistory {
  id: string;
  devisId: string;
  status: string;
  changedBy: string;
  changedAt: Date;
}

export interface DevisUpdateInput {
  number?: number;
  year?: number;
  reference?: string;
  status?: string;
  clientId?: string;
  devisComments?: string;
  showDevisComments?: boolean;
  orderFormComments?: string;
  showOrderFormComments?: boolean;
  showDescriptions?: boolean;
  catalog?: {
    connect: {
      id: string;
    };
  };
  sections?: {
    deleteMany: Record<string, never>;
    create: Array<{
      name: string;
      materialsTotal: number;
      subTotal: number;
      category: {
        connect: {
          id: string;
        };
      };
      services: {
        create: Array<{
          name: string;
          description?: string;
          price: number;
          quantity: number;
          unit?: string;
          order: number;
          category: {
            connect: {
              id: string;
            };
          };
          tva?: number;
          materials: {
            create: Array<{
              name: string;
              quantity: number;
              price: number;
              unit?: string;
            }>;
          };
        }>;
      };
    }>;
  };
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
  tva: number;
  billable?: boolean;
} 
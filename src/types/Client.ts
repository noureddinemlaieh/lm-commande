import type { Prescriber } from './Prescriber';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  notes?: string;
  prescriberId?: string;
  prescriber?: Prescriber;
  createdAt: Date;
  updatedAt: Date;
} 
import { Client } from './Client';
import { Devis } from './Devis';

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tva: number;
  amount: number;
  materials?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
    reference?: string;
    tva: number;
  }>;
}

export interface InvoiceSection {
  id: string;
  name: string;
  items: InvoiceItem[];
  subTotal: number;
  hidden?: boolean;
}

export interface Invoice {
  id: string;
  number: number;
  year: number;
  reference: string;
  status: string;
  clientId: string;
  client?: Client;
  devisId?: string;
  devis?: Devis;
  createdAt: string;
  invoiceDate: string;
  dueDate?: string;
  paymentMethod?: string;
  paymentConditions?: string;
  paymentStatus: string;
  autoliquidation?: boolean;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string;
  sections: InvoiceSection[];
  billToPrescriber?: boolean;
}

export const INVOICE_STATUSES = {
  DRAFT: { label: 'Brouillon', color: 'gray' },
  SENT: { label: 'Envoyée', color: 'blue' },
  PAID: { label: 'Payée', color: 'green' },
  OVERDUE: { label: 'En retard', color: 'red' }
};

export const PAYMENT_STATUSES = {
  UNPAID: { label: 'Non payée', color: 'red' },
  PARTIALLY_PAID: { label: 'Partiellement payée', color: 'orange' },
  PAID: { label: 'Payée', color: 'green' }
}; 
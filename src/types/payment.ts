export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
  CASH: 'Espèces',
  CREDIT_CARD: 'Carte bancaire'
};

export const PAYMENT_CONDITIONS = [
  "Paiement immédiat",
  "Acompte de 40%, solde avant la réception",
  "Acompte de 60%, solde avant la réception",
  "35/30/30/5",
  "30% maintenant, le solde à 60 jours",
  "40% maintenant, le solde à 60 jours",
  "15 jours",
  "21 jours",
  "30 jours",
  "45 jours",
  "Fin du mois suivant",
  "10 jours après la fin du mois suivant",
  "2/7 Net 30"
];

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]; 
export const DEVIS_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REFUSED: 'refused',
  CANCELED: 'canceled',
} as const;

export type DevisStatus = keyof typeof DEVIS_STATUS; 
import prisma from '@/lib/prisma';

export async function getNextDevisNumber(): Promise<{ reference: string; prescriberId?: string; number: number; year: number }> {
  try {
    const response = await fetch('/api/devis/sequence');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du numéro de devis');
    }
    
    const data = await response.json();
    
    // Utiliser directement la référence retournée par l'API
    const reference = data.reference;
    
    // Extraire le numéro à partir de la référence (en supposant un format comme "DEV-0001")
    // Cette partie peut nécessiter des ajustements en fonction du format exact
    const parts = reference.split('-');
    const number = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    const year = new Date().getFullYear();
    
    return {
      reference: reference,
      number,
      year,
      prescriberId: undefined
    };
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de devis:', error);
    return { reference: `ERROR-${Date.now()}`, number: 0, year: 0, prescriberId: undefined };
  }
} 
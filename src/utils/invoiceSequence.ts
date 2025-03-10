import prisma from '@/lib/prisma';

export async function getNextInvoiceNumber() {
  try {
    const currentYear = new Date().getFullYear();
    
    // Trouver la dernière facture de l'année en cours
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        year: currentYear
      },
      orderBy: {
        number: 'desc'
      }
    });
    
    // Si aucune facture n'existe pour cette année, commencer à 1
    const nextNumber = lastInvoice ? lastInvoice.number + 1 : 1;
    
    console.log(`Prochain numéro de facture: ${nextNumber} pour l'année ${currentYear}`);
    
    return {
      number: nextNumber,
      year: currentYear
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du prochain numéro de facture:", error);
    
    // En cas d'erreur, retourner un numéro par défaut
    return {
      number: 1,
      year: new Date().getFullYear()
    };
  }
} 
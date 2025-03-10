import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

console.log("Module API retention-guarantees/by-invoice/[invoiceId] chargé");

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    console.log("Recherche de retenue de garantie pour la facture:", params.invoiceId);
    
    if (!params.invoiceId) {
      console.error("Erreur: ID de facture manquant dans les paramètres");
      return NextResponse.json({ error: "ID de facture manquant" }, { status: 400 });
    }
    
    console.log("Tentative d'accès à la base de données avec prisma:", typeof prisma);
    console.log("prisma est défini:", prisma !== undefined);
    console.log("prisma.retentionGuarantee est défini:", prisma.retentionGuarantee !== undefined);
    
    try {
      console.log("Exécution de la requête prisma.retentionGuarantee.findFirst");
      const retention = await prisma.retentionGuarantee.findFirst({
        where: {
          invoiceId: params.invoiceId
        },
        include: {
          releases: true
        }
      });
      
      if (!retention) {
        console.log("Aucune retenue trouvée pour la facture:", params.invoiceId);
        return NextResponse.json([]);
      }
      
      console.log("Retenue trouvée:", retention.id);
      return NextResponse.json([retention]);
    } catch (dbError) {
      console.error("Erreur lors de l'accès à la base de données:", dbError);
      return NextResponse.json(
        { 
          error: "Erreur lors de l'accès à la base de données", 
          details: String(dbError), 
          stack: (dbError as Error).stack,
          message: "Impossible d'accéder à la table retentionGuarantee"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération de la retenue de garantie:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération de la retenue de garantie', 
        details: String(error), 
        stack: (error as Error).stack,
        message: "Une erreur inattendue s'est produite"
      },
      { status: 500 }
    );
  }
} 
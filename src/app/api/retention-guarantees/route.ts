import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

console.log("Module API retention-guarantees chargé");

export async function GET(request: NextRequest) {
  try {
    console.log("API GET retention-guarantees appelée");
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');
    
    console.log("Recherche de retenues avec les paramètres:", { status, invoiceId });
    
    const where: any = {};
    
    if (status) where.status = status;
    if (invoiceId) where.invoiceId = invoiceId;
    
    console.log("Critères de recherche:", where);
    
    try {
      console.log("Tentative d'accès à prisma.retentionGuarantee.findMany");
      console.log("prisma est défini:", prisma !== undefined);
      console.log("prisma.retentionGuarantee est défini:", prisma.retentionGuarantee !== undefined);
      
      const retentions = await prisma.retentionGuarantee.findMany({
        where,
        include: {
          invoice: {
            include: {
              client: true
            }
          },
          releases: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`${retentions.length} retenues trouvées`);
      
      return NextResponse.json(retentions);
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
    console.error('Erreur détaillée lors de la récupération des retenues de garantie:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des retenues de garantie', 
        details: String(error), 
        stack: (error as Error).stack,
        message: "Une erreur inattendue s'est produite"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Vérifier que l'ID de la facture est présent
    if (!data.invoiceId) {
      return NextResponse.json(
        { error: "L'ID de la facture est requis" },
        { status: 400 }
      );
    }
    
    try {
      // Vérifier si une retenue existe déjà pour cette facture
      const existingRetention = await prisma.retentionGuarantee.findFirst({
        where: {
          invoiceId: data.invoiceId
        }
      });
      
      if (existingRetention) {
        return NextResponse.json(
          { error: "Une retenue de garantie existe déjà pour cette facture" },
          { status: 400 }
        );
      }
      
      // Créer la retenue de garantie
      const retention = await prisma.retentionGuarantee.create({
        data: {
          invoiceId: data.invoiceId,
          rate: data.rate,
          amount: data.amount,
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
          status: data.status || 'PENDING',
          notes: data.notes
        },
        include: {
          invoice: true
        }
      });
      
      return NextResponse.json(retention);
    } catch (dbError) {
      console.error("Erreur lors de l'accès à la base de données:", dbError);
      return NextResponse.json(
        { 
          error: "Erreur lors de la création de la retenue de garantie", 
          details: String(dbError), 
          stack: (dbError as Error).stack
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la création de la retenue de garantie:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de la retenue de garantie",
        details: String(error),
        stack: (error as Error).stack
      },
      { status: 500 }
    );
  }
} 
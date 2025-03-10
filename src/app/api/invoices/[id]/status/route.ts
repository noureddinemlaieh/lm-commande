import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INVOICE_STATUSES } from '@/types/Invoice';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier que l'ID est valide
    if (!params.id) {
      return NextResponse.json(
        { error: 'ID de facture invalide' },
        { status: 400 }
      );
    }

    // Récupérer les données de la requête
    const data = await request.json();
    
    // Vérifier que le statut est fourni
    if (!data.status) {
      return NextResponse.json(
        { error: 'Le statut est requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que le statut est valide
    if (!Object.keys(INVOICE_STATUSES).includes(data.status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier que la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id }
    });
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }
    
    // Mettre à jour le statut de la facture
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { status: data.status }
    });
    
    // Enregistrer l'historique du changement de statut (optionnel)
    try {
      await prisma.invoiceStatusHistory.create({
        data: {
          invoiceId: params.id,
          status: data.status,
          changedAt: new Date(),
          changedBy: 'user' // Remplacer par l'ID de l'utilisateur connecté si disponible
        }
      });
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de l\'historique:', error);
      // Continuer même si l'enregistrement de l'historique échoue
    }
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
} 
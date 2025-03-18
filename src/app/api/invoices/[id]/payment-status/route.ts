import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PAYMENT_STATUSES } from '@/types/Invoice';

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
    
    // Vérifier que le statut de paiement est fourni
    if (!data.paymentStatus) {
      return NextResponse.json(
        { error: 'Le statut de paiement est requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que le statut de paiement est valide
    if (!Object.keys(PAYMENT_STATUSES).includes(data.paymentStatus)) {
      return NextResponse.json(
        { error: 'Statut de paiement invalide' },
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
    
    // Mettre à jour le statut de paiement de la facture
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { paymentStatus: data.paymentStatus }
    });
    
    // Si le statut de paiement est "PAID", mettre également à jour le statut de la facture à "PAID"
    if (data.paymentStatus === 'PAID') {
      await prisma.invoice.update({
        where: { id: params.id },
        data: { status: 'PAID' }
      });
    }
    
    // Enregistrer l'historique du changement de statut de paiement (optionnel)
    try {
      await prisma.invoicePaymentHistory.create({
        data: {
          invoiceId: params.id,
          paymentStatus: data.paymentStatus,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement de l\'historique:', error);
      // Continuer même si l'enregistrement de l'historique échoue
    }
    
    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut de paiement' },
      { status: 500 }
    );
  }
} 
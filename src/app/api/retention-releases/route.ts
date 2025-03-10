import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Vérifier que l'ID de la retenue est présent
    if (!data.retentionId) {
      return NextResponse.json(
        { error: "L'ID de la retenue est requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que le montant est présent
    if (data.amount === undefined || data.amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }
    
    // Récupérer la retenue pour vérifier le montant restant
    const retention = await prisma.retentionGuarantee.findUnique({
      where: {
        id: data.retentionId
      },
      include: {
        releases: true
      }
    });
    
    if (!retention) {
      return NextResponse.json(
        { error: "Retenue de garantie non trouvée" },
        { status: 404 }
      );
    }
    
    // Calculer le montant déjà libéré
    const releasedAmount = retention.releases.reduce((sum, release) => sum + release.amount, 0);
    
    // Calculer le montant restant
    const remainingAmount = retention.amount - releasedAmount;
    
    // Vérifier que le montant à libérer ne dépasse pas le montant restant
    if (data.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Le montant à libérer ne peut pas dépasser le montant restant (${remainingAmount.toFixed(2)} €)` },
        { status: 400 }
      );
    }
    
    // Créer la libération
    const release = await prisma.retentionRelease.create({
      data: {
        retentionId: data.retentionId,
        amount: data.amount,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
        notes: data.notes
      }
    });
    
    // Mettre à jour le statut de la retenue
    const newReleasedAmount = releasedAmount + data.amount;
    let newStatus = 'PENDING';
    
    if (newReleasedAmount >= retention.amount) {
      newStatus = 'RELEASED';
    } else if (newReleasedAmount > 0) {
      newStatus = 'PARTIAL';
    }
    
    await prisma.retentionGuarantee.update({
      where: {
        id: data.retentionId
      },
      data: {
        status: newStatus
      }
    });
    
    return NextResponse.json(release);
  } catch (error) {
    console.error("Erreur lors de la création de la libération:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la libération" },
      { status: 500 }
    );
  }
} 
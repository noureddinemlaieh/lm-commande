import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Récupération de la retenue de garantie:", params.id);
    
    const retention = await prisma.retentionGuarantee.findUnique({
      where: {
        id: params.id,
      },
      include: {
        invoice: {
          include: {
            client: true
          }
        },
        releases: {
          orderBy: {
            releaseDate: 'asc'
          }
        }
      },
    });
    
    if (!retention) {
      console.log("Retenue de garantie non trouvée:", params.id);
      return NextResponse.json({ error: 'Retenue de garantie non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json(retention);
  } catch (error) {
    console.error('Erreur lors de la récupération de la retenue de garantie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la retenue de garantie' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    console.log("Mise à jour de la retenue de garantie:", params.id);
    console.log("Données reçues:", data);
    
    // Extraire les releases pour les traiter séparément
    const { releases, ...retentionData } = data;
    
    // Convertir la date de libération en objet Date si elle existe
    if (retentionData.releaseDate) {
      retentionData.releaseDate = new Date(retentionData.releaseDate);
    }
    
    // Vérifier si la retenue existe
    const existingRetention = await prisma.retentionGuarantee.findUnique({
      where: { id: params.id },
      include: { releases: true }
    });
    
    if (!existingRetention) {
      return NextResponse.json(
        { error: 'Retenue de garantie non trouvée' },
        { status: 404 }
      );
    }
    
    // Mise à jour de la retenue de garantie
    const updatedRetention = await prisma.retentionGuarantee.update({
      where: { id: params.id },
      data: retentionData
    });
    
    // Gérer les libérations
    if (releases && Array.isArray(releases)) {
      // Supprimer toutes les libérations existantes
      await prisma.retentionRelease.deleteMany({
        where: { retentionId: params.id }
      });
      
      // Créer les nouvelles libérations
      for (const release of releases) {
        await prisma.retentionRelease.create({
          data: {
            retentionId: params.id,
            amount: release.amount,
            releaseDate: new Date(release.releaseDate),
            notes: release.notes || ''
          }
        });
      }
    }
    
    // Récupérer la retenue mise à jour avec ses libérations
    const finalRetention = await prisma.retentionGuarantee.findUnique({
      where: { id: params.id },
      include: {
        releases: {
          orderBy: {
            releaseDate: 'asc'
          }
        }
      }
    });
    
    return NextResponse.json(finalRetention);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la retenue de garantie:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour de la retenue de garantie',
        details: String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Suppression de la retenue de garantie:", params.id);
    
    // Vérifier si la retenue existe
    const existingRetention = await prisma.retentionGuarantee.findUnique({
      where: { id: params.id }
    });
    
    if (!existingRetention) {
      return NextResponse.json(
        { error: 'Retenue de garantie non trouvée' },
        { status: 404 }
      );
    }
    
    // Supprimer d'abord toutes les libérations associées
    await prisma.retentionRelease.deleteMany({
      where: { retentionId: params.id }
    });
    
    // Supprimer la retenue de garantie
    await prisma.retentionGuarantee.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la retenue de garantie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la retenue de garantie' },
      { status: 500 }
    );
  }
} 
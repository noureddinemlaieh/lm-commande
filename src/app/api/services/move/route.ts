import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { serviceId, targetCategoryId } = await request.json();

    if (!serviceId || !targetCategoryId) {
      return NextResponse.json(
        { error: 'ID de service et ID de catégorie cible requis' },
        { status: 400 }
      );
    }

    // Vérifier que le service existe
    const service = await prisma.catalogService.findUnique({
      where: { id: serviceId },
      include: { category: true }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que la catégorie cible existe
    const targetCategory = await prisma.catalogCategory.findUnique({
      where: { id: targetCategoryId }
    });

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Catégorie cible non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que les deux catégories appartiennent au même catalogue
    if (service.category.catalogId !== targetCategory.catalogId) {
      return NextResponse.json(
        { error: 'Les catégories doivent appartenir au même catalogue' },
        { status: 400 }
      );
    }

    // Déplacer le service vers la nouvelle catégorie
    const updatedService = await prisma.catalogService.update({
      where: { id: serviceId },
      data: {
        categoryId: targetCategoryId
      },
      include: {
        materials: true
      }
    });

    return NextResponse.json({
      success: true,
      service: updatedService
    });
  } catch (error) {
    console.error('Erreur lors du déplacement du service:', error);
    return NextResponse.json(
      { error: 'Erreur lors du déplacement du service' },
      { status: 500 }
    );
  }
} 
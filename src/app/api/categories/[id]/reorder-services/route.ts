import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    const data = await request.json();
    
    if (!Array.isArray(data.services)) {
      return NextResponse.json(
        { error: 'Les services doivent être un tableau' },
        { status: 400 }
      );
    }
    
    console.log(`Réorganisation des services pour la catégorie ${categoryId}`);
    console.log('Nouvel ordre des services:', data.services);
    
    // Mettre à jour l'ordre de chaque service
    for (const serviceUpdate of data.services) {
      if (!serviceUpdate.id || typeof serviceUpdate.order !== 'number') {
        console.error('Données de service invalides:', serviceUpdate);
        continue;
      }
      
      try {
        await prisma.catalogService.update({
          where: { id: serviceUpdate.id },
          data: { order: serviceUpdate.order }
        });
        console.log(`Service ${serviceUpdate.id} mis à jour avec l'ordre ${serviceUpdate.order}`);
      } catch (updateError) {
        console.error(`Erreur lors de la mise à jour du service ${serviceUpdate.id}:`, updateError);
        throw updateError;
      }
    }
    
    // Récupérer la catégorie mise à jour avec ses services
    const updatedCategory = await prisma.catalogCategory.findUnique({
      where: { id: categoryId },
      include: {
        services: {
          orderBy: { order: 'asc' },
          include: {
            materials: true
          }
        }
      }
    });
    
    if (!updatedCategory) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Erreur lors de la réorganisation des services:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la réorganisation des services',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
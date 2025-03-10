import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Vérifier si le catalogue existe
    const catalog = await prisma.catalog.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catalogue non trouvé' },
        { status: 404 }
      );
    }

    // Ici, vous pouvez ajouter la logique spécifique pour la sauvegarde
    // Par exemple, mettre à jour la date de modification
    const updatedCatalog = await prisma.catalog.update({
      where: { id },
      data: {
        updatedAt: new Date(),
      },
      include: {
        categories: {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Catalogue sauvegardé avec succès',
      catalog: updatedCatalog
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du catalogue:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la sauvegarde du catalogue',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
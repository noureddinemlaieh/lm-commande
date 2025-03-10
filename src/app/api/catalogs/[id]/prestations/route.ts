import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '0', 10); // Défaut à 0 pour récupérer toutes les prestations
    
    // Valider les paramètres de pagination
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 ? limit : undefined; // Si limit est 0, on ne limite pas les résultats
    const skip = validLimit ? (validPage - 1) * validLimit : undefined;

    // Récupérer le catalogue avec ses catégories et services
    const catalog = await prisma.catalog.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        categories: {
          select: {
            id: true,
            name: true,
            order: true,
            services: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                quantity: true,
                unit: true,
                order: true,
                materials: {
                  select: {
                    id: true,
                    name: true,
                    quantity: true,
                    price: true,
                    unit: true,
                    reference: true
                  }
                }
              },
              orderBy: {
                order: 'asc'
              },
              skip: skip,
              take: validLimit
            }
          },
          orderBy: {
            order: 'asc'
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

    // Compter le nombre total de services pour la pagination
    const totalServices = await prisma.catalogService.count({
      where: {
        category: {
          catalogId: params.id
        }
      }
    });

    return NextResponse.json({
      ...catalog,
      pagination: {
        total: totalServices,
        page: validPage,
        limit: validLimit || totalServices,
        totalPages: validLimit ? Math.ceil(totalServices / validLimit) : 1
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prestations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prestations' },
      { status: 500 }
    );
  }
} 
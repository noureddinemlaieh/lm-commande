import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Recherche des services pour le catalogue:', params.id);
    
    const services = await prisma.devisService.findMany({
      where: {
        catalogId: params.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        unit: true,
        tva: true,
        categoryId: true,
        materials: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            quantity: true,
            reference: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Services trouvés:', services.length);

    return NextResponse.json(services);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    );
  }
} 
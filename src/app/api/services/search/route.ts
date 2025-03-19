import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json([]);
    }

    const services = await prisma.devisService.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        unit: true,
        tva: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 10
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Erreur lors de la recherche des prestations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche des prestations' },
      { status: 500 }
    );
  }
} 
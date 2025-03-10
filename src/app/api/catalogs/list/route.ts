import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const catalogs = await prisma.catalog.findMany({
      include: {
        categories: {
          include: {
            services: true
          }
        }
      }
    });
    
    return NextResponse.json(catalogs);
  } catch (error) {
    console.error('Erreur lors de la récupération des catalogues:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catalogues' },
      { status: 500 }
    );
  }
} 
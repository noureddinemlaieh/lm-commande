import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const catalogs = await prisma.catalog.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const catalog = await prisma.catalog.create({
      data: {
        name,
        description,
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Erreur lors de la création du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du catalogue' },
      { status: 500 }
    );
  }
} 
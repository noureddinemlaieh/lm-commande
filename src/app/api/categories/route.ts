import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.catalogCategory.findMany({
      include: {
        services: {
          include: {
            materials: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const category = await prisma.catalogCategory.create({
      data: {
        name: data.name,
        description: data.description,
        catalogId: data.catalogId,
        order: data.order || 0
      }
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la catégorie' },
      { status: 500 }
    );
  }
} 
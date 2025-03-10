import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catalogId = params.id;

    if (!catalogId) {
      console.error('ID du catalogue non fourni');
      return NextResponse.json(
        { error: 'ID du catalogue non fourni' },
        { status: 400 }
      );
    }

    console.log(`Tentative de récupération des catégories pour le catalogue ${catalogId}`);

    // Récupérer les catégories du catalogue en utilisant le bon modèle CatalogCategory
    const categories = await prisma.catalogCategory.findMany({
      where: {
        catalogId: catalogId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    console.log(`Nombre de catégories trouvées pour le catalogue ${catalogId}:`, categories.length);
    
    if (categories.length === 0) {
      console.log(`Aucune catégorie trouvée pour le catalogue ${catalogId}`);
    } else {
      console.log(`Catégories trouvées pour le catalogue ${catalogId}:`, categories.map(cat => ({ id: cat.id, name: cat.name })));
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const catalogId = params.id;

    if (!catalogId) {
      return NextResponse.json(
        { error: 'ID du catalogue non fourni' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Le nom de la catégorie est obligatoire' },
        { status: 400 }
      );
    }

    console.log(`Tentative de création d'une catégorie dans le catalogue ${catalogId}:`, data);

    // Créer la catégorie dans le catalogue
    const category = await prisma.catalogCategory.create({
      data: {
        name: data.name,
        description: data.description,
        catalogId: catalogId,
        order: data.order || 0
      }
    });

    console.log(`Catégorie créée:`, category);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { categories } = await request.json();
    
    // Mettre à jour l'ordre de toutes les catégories en une seule transaction
    await prisma.$transaction(
      categories.map((category: { id: string; order: number }) =>
        prisma.catalogCategory.update({
          where: { id: category.id },
          data: { order: category.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la réorganisation des catégories:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réorganisation des catégories' },
      { status: 500 }
    );
    }
} 
import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const category = await prisma.catalogCategory.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    console.log('Suppression des matériaux associés...');
    await prisma.catalogMaterial.deleteMany({
      where: {
        service: {
          categoryId: id,
        },
      },
    });

    console.log('Suppression des services...');
    await prisma.catalogService.deleteMany({
      where: {
        categoryId: id,
      },
    });

    console.log('Suppression de la catégorie...');
    await prisma.catalogCategory.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Catégorie supprimée avec succès' }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la suppression de la catégorie', error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    console.log(`Récupération de la catégorie avec l'ID: ${id}`);
    
    const category = await prisma.catalogCategory.findUnique({
      where: { id },
      include: {
        catalog: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la catégorie' },
      { status: 500 }
    );
  }
} 
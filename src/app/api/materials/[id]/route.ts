import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();

    console.log('Données reçues:', { id, data });

    // Validation des données
    if (data.quantity !== undefined && typeof data.quantity !== 'number') {
      return NextResponse.json(
        { error: 'La quantité doit être un nombre' },
        { status: 400 }
      );
    }
    if (data.price !== undefined && typeof data.price !== 'number') {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre' },
        { status: 400 }
      );
    }

    // Ajout de logs pour déboguer
    console.log('Tentative de mise à jour avec:', {
      id,
      data: {
        quantity: data.quantity,
        price: data.price,
        unit: data.unit,
        toChoose: data.toChoose
      }
    });

    const updatedMaterial = await prisma.catalogMaterial.update({
      where: { id },
      data: {
        quantity: data.quantity !== undefined ? data.quantity : undefined,
        price: data.price !== undefined ? data.price : undefined,
        unit: data.unit !== undefined ? data.unit : undefined,
        toChoose: data.toChoose !== undefined ? data.toChoose : undefined,
      },
    });

    console.log('Matériau mis à jour:', updatedMaterial);

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du matériau',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await prisma.catalogMaterial.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Matériau supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du matériau' },
      { status: 500 }
    );
  }
} 
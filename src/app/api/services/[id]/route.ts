import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.catalogService.findUnique({
      where: { id: params.id },
      include: {
        materials: true
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du service' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const updatedService = await prisma.catalogService.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        unit: data.unit,
        categoryId: data.categoryId,
      },
      include: {
        materials: true
      }
    });
    return NextResponse.json(updatedService);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Supprimer d'abord tous les matériaux associés au service
    await prisma.catalogMaterial.deleteMany({
      where: { serviceId: params.id }
    });

    // Ensuite, supprimer le service
    await prisma.catalogService.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du service' },
      { status: 500 }
    );
  }
} 
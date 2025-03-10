import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const setting = await prisma.settings.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: 'Paramètre non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du paramètre' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { key, value, description, category } = body;

    // Vérifier si la clé existe déjà pour un autre paramètre
    const existingKey = await prisma.settings.findFirst({
      where: {
        key,
        NOT: {
          id,
        },
      },
    });

    if (existingKey) {
      return NextResponse.json(
        { error: 'Cette clé existe déjà pour un autre paramètre' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.update({
      where: { id },
      data: {
        key,
        value,
        description,
        category,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du paramètre' },
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
    await prisma.settings.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du paramètre' },
      { status: 500 }
    );
  }
} 
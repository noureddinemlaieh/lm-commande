import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const product = await prisma.product.update({
      where: { id: params.id },
      data: body
    });
    return NextResponse.json(product);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du produit' },
      { status: 500 }
    );
  }
} 
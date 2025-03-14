import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; prestationId: string } }
) {
  try {
    const { materialId, quantity } = await request.json();
    
    // Vérifier que les paramètres requis sont présents
    if (!materialId || quantity === undefined) {
      return NextResponse.json(
        { error: 'ID du matériau et quantité requis' },
        { status: 400 }
      );
    }
    
    // Récupérer le produit pour obtenir ses informations
    const product = await prisma.product.findUnique({
      where: { id: materialId }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Matériau non trouvé' },
        { status: 404 }
      );
    }
    
    // Ajouter le matériau au service
    const material = await prisma.catalogMaterial.create({
      data: {
        name: product.name,
        serviceId: params.prestationId,
        quantity: quantity,
        unit: product.unit || '',
        price: product.sellingPrice,
        reference: product.reference,
        toChoose: false
      }
    });
    
    return NextResponse.json(material);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du matériau:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du matériau' },
      { status: 500 }
    );
  }
} 
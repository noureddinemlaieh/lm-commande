import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { serviceId, materialId, quantity } = await request.json();
    
    // Vérifier que les paramètres requis sont présents
    if (!serviceId || !materialId || quantity === undefined) {
      return NextResponse.json(
        { error: 'ID du service, ID du matériau et quantité requis' },
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
        serviceId: serviceId,
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

export async function GET() {
  try {
    const materials = await prisma.catalogMaterial.findMany();
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Erreur lors de la récupération des matériaux:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des matériaux' },
      { status: 500 }
    );
  }
} 
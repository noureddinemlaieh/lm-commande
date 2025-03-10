import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Données reçues:', body);

    // Validation des données
    if (!body.name) {
      return NextResponse.json(
        { error: 'Le nom est obligatoire' },
        { status: 400 }
      );
    }
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'La catégorie est obligatoire' },
        { status: 400 }
      );
    }

    // Création du service
    const service = await prisma.catalogService.create({
      data: {
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        price: body.price || 0,
        quantity: body.quantity || 1,
        unit: body.unit,
        order: body.order || 0,
      }
    });

    // Si des matériaux sont fournis, les ajouter
    if (body.materials && Array.isArray(body.materials)) {
      for (const material of body.materials) {
        // Récupérer les informations du produit
        const product = await prisma.product.findUnique({
          where: { id: material.productId }
        });

        if (product) {
          await prisma.catalogMaterial.create({
            data: {
              name: product.name,
              quantity: material.quantity || 1,
              price: product.sellingPrice,
              unit: product.unit || null,
              serviceId: service.id,
              reference: product.reference || null,
              toChoose: false
            }
          });
        }
      }
    }

    // Récupérer le service avec ses matériaux
    const updatedService = await prisma.catalogService.findUnique({
      where: { id: service.id },
      include: {
        materials: true
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du service',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const services = await prisma.catalogService.findMany({
      include: {
        materials: true
      }
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    );
  }
} 
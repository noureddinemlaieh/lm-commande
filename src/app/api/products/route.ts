import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // Construire les filtres
    const filters: any = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Récupérer les produits
    const products = await prisma.product.findMany({
      where: filters,
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: body
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
} 
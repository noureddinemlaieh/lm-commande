import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    if (!category) {
      return NextResponse.json(
        { error: 'Le paramètre category est requis' },
        { status: 400 }
      );
    }
    
    const settings = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "Settings" WHERE category = ${category}
    `;
    
    // Convertir le tableau en objet clé-valeur
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    
    return NextResponse.json(settingsObject);
  } catch (error: any) {
    console.error('Error fetching settings by category:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres', details: error.message },
      { status: 500 }
    );
  }
} 
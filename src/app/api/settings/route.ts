import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.$queryRaw`SELECT * FROM "Settings" ORDER BY "category" ASC`;
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paramètres' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, description, category } = body;

    // Vérifier si la clé existe déjà
    const existingKeys = await prisma.$queryRaw<Array<any>>`SELECT * FROM "Settings" WHERE key = ${key}`;
    if (existingKeys.length > 0) {
      return NextResponse.json(
        { error: 'Cette clé existe déjà' },
        { status: 400 }
      );
    }

    // Créer le paramètre
    const setting = await prisma.$executeRaw`
      INSERT INTO "Settings" (id, key, value, description, category, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${key}, ${value}, ${description || ''}, ${category || 'GENERAL'}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating setting:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du paramètre' },
      { status: 500 }
    );
  }
} 
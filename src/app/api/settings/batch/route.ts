import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Le corps de la requête doit être un tableau' },
        { status: 400 }
      );
    }
    
    // Validation des données d'entrée
    for (const setting of body) {
      if (!setting.key || setting.value === undefined) {
        return NextResponse.json(
          { error: `Paramètre invalide: chaque élément doit avoir une clé et une valeur`, setting },
          { status: 400 }
        );
      }
    }
    
    // Traiter chaque paramètre individuellement avec des requêtes SQL brutes
    for (const setting of body) {
      const { key, value, description, category } = setting;
      
      // Vérifier si le paramètre existe
      const existingSettings = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM "Settings" WHERE key = ${key}
      `;
      
      if (existingSettings.length > 0) {
        // Mettre à jour le paramètre existant
        await prisma.$executeRaw`
          UPDATE "Settings" 
          SET value = ${String(value)}, 
              description = ${description || null}, 
              category = ${category || 'GENERAL'},
              "updatedAt" = NOW()
          WHERE key = ${key}
        `;
      } else {
        // Créer un nouveau paramètre
        await prisma.$executeRaw`
          INSERT INTO "Settings" (id, key, value, description, category, "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${key}, ${String(value)}, ${description || null}, ${category || 'GENERAL'}, NOW(), NOW())
        `;
      }
    }
    
    return NextResponse.json({ success: true, count: body.length });
  } catch (error: any) {
    console.error('Error batch updating settings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des paramètres', details: error.message },
      { status: 500 }
    );
  }
} 
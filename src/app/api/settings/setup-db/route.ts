import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST() {
  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    // Vérifier si la table Settings existe déjà
    let tableExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Settings" LIMIT 1`;
      tableExists = true;
    } catch (_e) {
      // La table n'existe pas
    }

    if (!tableExists) {
      // Créer la table manuellement si elle n'existe pas
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Settings" (
          "id" TEXT NOT NULL,
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "category" TEXT NOT NULL DEFAULT 'GENERAL',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Settings_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "Settings_key_key" UNIQUE ("key")
        )
      `;
    }

    // Paramètres par défaut pour la numérotation
    const defaultSettings = [
      // Devis
      { key: 'devis_prefix', value: 'DEV', category: 'NUMEROTATION', description: 'Préfixe pour les numéros de devis' },
      { key: 'devis_digits', value: '4', category: 'NUMEROTATION', description: 'Nombre de chiffres pour le compteur de devis' },
      { key: 'devis_counter', value: '1', category: 'NUMEROTATION', description: 'Compteur actuel pour les devis' },
      { key: 'devis_format', value: '{PREFIX}{COUNTER}', category: 'NUMEROTATION', description: 'Format de numérotation des devis' },
      
      // Factures et bons de commande (comme dans votre code précédent)
      // ...
    ];

    // Insérer les paramètres par défaut
    for (const setting of defaultSettings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          id: Math.random().toString(36).substring(2, 15),
          ...setting
        }
      });
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Base de données initialisée avec succès',
      tableCreated: !tableExists
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'initialisation de la base de données',
      details: error.message
    }, { status: 500 });
  }
} 
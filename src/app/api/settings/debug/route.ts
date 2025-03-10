import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    // Créer une nouvelle instance de PrismaClient pour tester la connexion
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    // Tester la connexion
    await prisma.$connect();
    
    // Vérifier si la table Settings existe
    let tableExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Settings" LIMIT 1`;
      tableExists = true;
    } catch (_e) {
      // La table n'existe probablement pas
    }
    
    // Déconnecter proprement
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Test de connexion réussi',
      databaseUrl: process.env.DATABASE_URL ? 'Défini' : 'Non défini',
      tableExists
    });
  } catch (error: any) {
    console.error('Erreur de connexion à la base de données:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de connexion à la base de données',
      details: error.message,
      stack: error.stack,
      databaseUrl: process.env.DATABASE_URL ? 'Défini' : 'Non défini'
    }, { status: 500 });
  }
} 
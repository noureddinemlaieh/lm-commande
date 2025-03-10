import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test simple de connexion à la base de données
    const count = await prisma.settings.count();
    
    return NextResponse.json({
      success: true,
      message: 'Connexion à la base de données réussie',
      count
    });
  } catch (error: any) {
    console.error('Erreur de connexion à la base de données:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de connexion à la base de données',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 
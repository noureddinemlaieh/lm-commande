import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prescriberId = searchParams.get('prescriberId');
    
    if (prescriberId) {
      const clients = await prisma.client.findMany({
        where: {
          prescriberId: prescriberId
        },
        orderBy: {
          name: 'asc'
        }
      });
      return NextResponse.json(clients);
    }
    
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extraire les champs valides du modèle Client
    const {
      name, email, phone, address, city, postalCode, country, 
      company, notes, prescriberId
    } = body;
    
    // Vérifier si le prescripteur existe si un ID est fourni
    if (prescriberId) {
      const prescriber = await prisma.prescriber.findUnique({
        where: { id: prescriberId }
      });
      
      if (!prescriber) {
        return NextResponse.json(
          { error: 'Prescripteur non trouvé' },
          { status: 404 }
        );
      }
    }
    
    // Créer avec uniquement les champs valides
    const client = await prisma.client.create({
      data: {
        name, email, phone, address, city, postalCode, country, 
        company, notes, prescriberId
      }
    });
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur détaillée lors de la création du client:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du client',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
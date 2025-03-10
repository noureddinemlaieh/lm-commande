import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const client = await prisma.client.findUnique({
      where: { id }
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Extraire les champs valides du modèle Client
    const {
      name, email, phone, address, city, postalCode, country, 
      company, notes, prescriberId
    } = body;
    
    // Vérifier si le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }
    
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
    
    // Mettre à jour avec uniquement les champs valides
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name, email, phone, address, city, postalCode, country, 
        company, notes, prescriberId
      }
    });
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Vérifier si le client existe
    const existingClient = await prisma.client.findUnique({
      where: { id }
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier si le client est utilisé dans des devis
    const devisCount = await prisma.devis.count({
      where: { clientId: id }
    });
    
    if (devisCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce client car il est utilisé dans des devis' },
        { status: 400 }
      );
    }
    
    // Supprimer le client
    await prisma.client.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du client' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const prescribers = await prisma.prescriber.findMany({
      orderBy: {
        nom: 'asc'
      }
    });
    return NextResponse.json(prescribers);
  } catch (error) {
    console.error('Erreur lors de la récupération des prescripteurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prescripteurs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extraire les champs du corps de la requête
    const {
      nom, contact, cp, mail1, mail2, mail3, pays, rue, siret, 
      siteweb, tel, tel1, tel2, tel3, tva, ville, logo, _contacts,
      requiresRetentionGuarantee, defaultRetentionRate, defaultAutoliquidation, defaultBillToPrescriber
    } = body;
    
    // Créer le prescripteur sans le logo
    const prescriber = await prisma.prescriber.create({
      data: {
        nom, contact, cp, mail1, mail2, mail3, pays, rue, siret, 
        siteweb, tel, tel1, tel2, tel3, tva, ville,
        requiresRetentionGuarantee: requiresRetentionGuarantee === true,
        defaultRetentionRate: defaultRetentionRate !== undefined && defaultRetentionRate !== null 
          ? parseFloat(String(defaultRetentionRate)) 
          : 5,
        defaultAutoliquidation: defaultAutoliquidation === true,
        defaultBillToPrescriber: defaultBillToPrescriber === true
      }
    });
    
    // Si le logo a été fourni, mettre à jour manuellement dans la base de données
    if (logo !== undefined) {
      // Mettre à jour le logo séparément avec une requête SQL brute
      await prisma.$executeRaw`UPDATE "Prescriber" SET "logo" = ${logo} WHERE "id" = ${prescriber.id}`;
    }
    
    // Si des contacts ont été fournis, les créer
    /*
    if (contacts && Array.isArray(contacts)) {
      for (const contact of contacts) {
        await prisma.contact.create({
          data: {
            ...contact,
            prescriberId: prescriber.id
          }
        });
      }
    }
    */
    
    // Récupérer le prescripteur mis à jour avec le logo
    const updatedPrescriber = await prisma.prescriber.findUnique({
      where: { id: prescriber.id },
      // include: { contacts: true }
    });
    
    return NextResponse.json(updatedPrescriber);
  } catch (error) {
    console.error('Erreur détaillée lors de la création du prescripteur:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du prescripteur',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
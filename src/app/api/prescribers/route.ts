import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const prescribers = await prisma.prescriber.findMany();
    
    // Transformer les résultats pour correspondre au format attendu par le frontend
    const transformedPrescribers = prescribers.map(p => ({
      id: p.id,
      nom: p.name,
      contact: p.contact,
      cp: p.postalCode,
      mail1: p.mail1,
      mail2: p.mail2,
      mail3: p.mail3,
      pays: p.country,
      rue: p.address,
      siret: p.siret,
      siteweb: p.siteweb,
      tel: p.tel,
      tel1: p.tel1,
      tel2: p.tel2,
      tel3: p.tel3,
      tva: p.tva,
      ville: p.city,
      logo: p.logo,
      requiresRetentionGuarantee: p.requiresRetentionGuarantee,
      defaultRetentionRate: p.defaultRetentionRate,
      defaultAutoliquidation: p.defaultAutoliquidation,
      defaultBillToPrescriber: p.defaultBillToPrescriber,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
    
    // Trier les résultats côté serveur
    transformedPrescribers.sort((a, b) => a.nom.localeCompare(b.nom));
    
    return NextResponse.json(transformedPrescribers);
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
    
    // Log du body complet pour déboguer
    console.log('Body complet reçu:', JSON.stringify(body, null, 2));
    
    // Extraire les champs du corps de la requête
    const {
      nom, contact, cp, mail1, mail2, mail3, pays, rue, siret, 
      siteweb, tel, tel1, tel2, tel3, tva, ville, logo,
      requiresRetentionGuarantee, defaultRetentionRate, defaultAutoliquidation, defaultBillToPrescriber
    } = body;
    
    // Créer le prescripteur avec les champs mappés correctement
    const prescriber = await prisma.prescriber.create({
      data: {
        name: nom || '',
        contact, 
        postalCode: cp,
        mail1, 
        mail2, 
        mail3, 
        country: pays,
        address: rue,
        siret, 
        siteweb, 
        tel, 
        tel1, 
        tel2, 
        tel3, 
        tva, 
        city: ville,
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
    
    // Récupérer le prescripteur mis à jour avec le logo
    const updatedPrescriber = await prisma.prescriber.findUnique({
      where: { id: prescriber.id },
    });
    
    // Transformer le résultat pour correspondre au format attendu par le frontend
    const transformedPrescriber = updatedPrescriber ? {
      id: updatedPrescriber.id,
      nom: updatedPrescriber.name,
      contact: updatedPrescriber.contact,
      cp: updatedPrescriber.postalCode,
      mail1: updatedPrescriber.mail1,
      mail2: updatedPrescriber.mail2,
      mail3: updatedPrescriber.mail3,
      pays: updatedPrescriber.country,
      rue: updatedPrescriber.address,
      siret: updatedPrescriber.siret,
      siteweb: updatedPrescriber.siteweb,
      tel: updatedPrescriber.tel,
      tel1: updatedPrescriber.tel1,
      tel2: updatedPrescriber.tel2,
      tel3: updatedPrescriber.tel3,
      tva: updatedPrescriber.tva,
      ville: updatedPrescriber.city,
      logo: updatedPrescriber.logo,
      requiresRetentionGuarantee: updatedPrescriber.requiresRetentionGuarantee,
      defaultRetentionRate: updatedPrescriber.defaultRetentionRate,
      defaultAutoliquidation: updatedPrescriber.defaultAutoliquidation,
      defaultBillToPrescriber: updatedPrescriber.defaultBillToPrescriber,
      createdAt: updatedPrescriber.createdAt,
      updatedAt: updatedPrescriber.updatedAt
    } : null;
    
    return NextResponse.json(transformedPrescriber);
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
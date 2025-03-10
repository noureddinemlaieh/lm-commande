import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prescriber = await prisma.prescriber.findUnique({
      where: { id: params.id }
    });

    if (!prescriber) {
      return NextResponse.json(
        { error: 'Prescripteur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(prescriber);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du prescripteur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Vérifier si le prescripteur existe
    const existingPrescriber = await prisma.prescriber.findUnique({
      where: { id: params.id }
    });
    
    if (!existingPrescriber) {
      return NextResponse.json(
        { error: 'Prescripteur non trouvé' },
        { status: 404 }
      );
    }
    
    // Extraire les champs valides du modèle Prescriber
    const {
      nom, contact, cp, mail1, mail2, mail3, pays, rue, siret, 
      siteweb, tel, tel1, tel2, tel3, tva, ville, logo, requiresRetentionGuarantee,
      defaultRetentionRate, defaultAutoliquidation, defaultBillToPrescriber
    } = body;
    
    // Mettre à jour avec uniquement les champs valides
    const prescriber = await prisma.prescriber.update({
      where: { id: params.id },
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
    
    // Si le logo a été mis à jour, mettre à jour manuellement dans la base de données
    if (logo !== undefined) {
      // Mettre à jour le logo séparément avec une requête SQL brute
      await prisma.$executeRaw`UPDATE "Prescriber" SET "logo" = ${logo} WHERE "id" = ${params.id}`;
    }
    
    return NextResponse.json(prescriber);
  } catch (_error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du prescripteur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.prescriber.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du prescripteur' },
      { status: 500 }
    );
  }
} 
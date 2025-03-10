import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getNextInvoiceNumber } from '@/utils/invoiceSequence';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const devisId = searchParams.get('devisId');
    const status = searchParams.get('status');
    
    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (devisId) where.devisId = devisId;
    if (status) where.status = status;
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        devis: {
          select: {
            reference: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transformer les données pour le frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      year: invoice.year,
      reference: invoice.reference,
      status: invoice.status,
      clientId: invoice.clientId,
      client: invoice.client,
      devisId: invoice.devisId,
      devisReference: invoice.devis?.reference,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate?.toISOString(),
      paymentMethod: invoice.paymentMethod,
      paymentStatus: invoice.paymentStatus,
      totalHT: invoice.totalHT,
      totalTVA: invoice.totalTVA,
      totalTTC: invoice.totalTTC,
      notes: invoice.notes
    }));
    
    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Vérifier que l'ID du client est présent
    if (!data.clientId) {
      return NextResponse.json(
        { error: "Le clientId est requis" },
        { status: 400 }
      );
    }
    
    // Extraire les données de retenue de garantie si présentes
    const { retentionGuarantee, ...restData } = data;
    
    // Préparer les données pour la base de données
    const invoiceData = {
      ...restData,
      createdAt: new Date().toISOString(),
      // Assurez-vous que les champs booléens sont inclus
      billToPrescriber: data.billToPrescriber || false,
      hidePrescriber: data.hidePrescriber || false,
    };
    
    // Générer le numéro de facture
    let reference = '';
    let number = 0;
    const year = new Date().getFullYear();
    
    try {
      // Essayer d'obtenir le numéro de facture via l'API de séquence
      const sequenceResponse = await fetch(new URL('/api/facture/sequence', request.url).toString());
      
      if (sequenceResponse.ok) {
        const sequenceData = await sequenceResponse.json();
        reference = sequenceData.reference;
        
        // Extraire le numéro de la référence (par exemple, de "FAC-001" à 1)
        const match = reference.match(/FAC-(\d+)/);
        if (match && match[1]) {
          number = parseInt(match[1], 10);
        } else {
          // Si le format ne correspond pas, utiliser un numéro par défaut
          number = 1;
        }
      } else {
        // Si l'API de séquence échoue, générer un numéro manuellement
        const result = await getNextInvoiceNumber();
        number = result.number;
        
        // Forcer le format FAC-XXX
        reference = `FAC-${String(number).padStart(3, '0')}`;
      }
      
      console.log(`Numéro de facture généré: ${reference}`);
    } catch (error) {
      console.error("Erreur lors de la génération du numéro de facture:", error);
      
      // En cas d'erreur, générer un numéro basé sur la date
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-3);
      number = parseInt(timestamp, 10);
      reference = `FAC-${String(number).padStart(3, '0')}`;
      
      console.log(`Numéro de facture de secours généré: ${reference}`);
    }
    
    // Calculer les totaux
    let totalHT = 0;
    let totalTVA = 0;
    
    data.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        const itemHT = item.quantity * item.unitPrice;
        const itemTVA = itemHT * (item.tva / 100);
        totalHT += itemHT;
        totalTVA += itemTVA;
      });
    });
    
    const totalTTC = totalHT + totalTVA;
    
    // Préparer les données de création de la facture
    const createData: any = {
      number,
      year,
      reference,
      status: data.status || 'DRAFT',
      clientId: data.clientId,
      devisId: data.devisId,
      invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || 'UNPAID',
      totalHT,
      totalTVA,
      totalTTC,
      notes: data.notes,
      sections: {
        create: data.sections.map((section: any) => ({
          name: section.name,
          subTotal: section.subTotal,
          items: {
            create: section.items.map((item: any) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              tva: item.tva,
              amount: item.quantity * item.unitPrice,
              materials: item.materials ? {
                create: item.materials.map((material: any) => ({
                  name: material.name,
                  quantity: material.quantity,
                  price: material.price,
                  unit: material.unit,
                  reference: material.reference,
                  tva: material.tva
                }))
              } : undefined
            }))
          }
        }))
      }
    };
    
    // Ajouter la retenue de garantie si elle existe
    if (retentionGuarantee && retentionGuarantee.rate && retentionGuarantee.amount) {
      createData.retentionGuarantee = {
        create: {
          rate: retentionGuarantee.rate,
          amount: retentionGuarantee.amount,
          releaseDate: retentionGuarantee.releaseDate ? new Date(retentionGuarantee.releaseDate) : null,
          status: 'PENDING',
          notes: retentionGuarantee.notes
        }
      };
      
      console.log("Création de facture avec retenue de garantie:", {
        rate: retentionGuarantee.rate,
        amount: retentionGuarantee.amount
      });
    }
    
    // Créer la facture avec l'ID du client
    const invoice = await prisma.invoice.create({
      data: createData,
      include: {
        client: true,
        devis: true,
        sections: {
          include: {
            items: true
          }
        },
        retentionGuarantee: true
      },
    });
    
    // Mettre à jour les champs manquants avec une requête SQL directe
    await prisma.$executeRaw`
      UPDATE "Invoice" 
      SET "paymentConditions" = ${data.paymentConditions || null}, 
          "autoliquidation" = ${data.autoliquidation || false}
      WHERE "id" = ${invoice.id}
    `;
    
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Erreur détaillée lors de la création de la facture:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la facture", details: String(error) },
      { status: 500 }
    );
  }
} 
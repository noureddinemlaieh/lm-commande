import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Données reçues:', JSON.stringify(data, null, 2));

    // Vérifier que les données essentielles sont présentes
    if (!data.clientId || !data.catalogId) {
      return NextResponse.json(
        { error: 'Données incomplètes', details: 'clientId et catalogId sont requis' },
        { status: 400 }
      );
    }

    // Formater correctement la date d'expiration
    let expirationDate: string | null = null;
    if (data.expirationDate) {
      try {
        expirationDate = new Date(data.expirationDate).toISOString();
      } catch (error) {
        console.error('Erreur de formatage de date:', error);
        return NextResponse.json(
          { error: 'Format de date invalide', details: 'La date d\'expiration doit être au format YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }

    // Préparer les données pour la création
    const createData = {
      number: String(data.number),
      year: Number(data.year),
      reference: data.reference,
      status: data.status || 'DRAFT',
      globalServiceTVA: Number(data.globalServiceTVA) || 20,
      globalMaterialTVA: Number(data.globalMaterialTVA) || 20,
      expirationDate: expirationDate,
      paymentMethod: data.paymentMethod || 'Virement bancaire',
      client: { connect: { id: data.clientId } },
      totalHT: Number(data.totalHT) || 0,
      totalTTC: Number(data.totalTTC) || 0
    };

    // Utiliser une transaction pour garantir l'intégrité des données
    const createdDevis = await prisma.$transaction(async (tx) => {
      // 1. Créer le devis principal
      const devis = await tx.devis.create({
        data: {
          ...createData,
          catalog: { connect: { id: data.catalogId } },
          prescriber: data.prescriberId ? { connect: { id: data.prescriberId } } : undefined
        }
      });

      // 2. Créer les sections avec leurs services et matériaux
      if (data.sections && data.sections.length > 0) {
        for (let sectionIndex = 0; sectionIndex < data.sections.length; sectionIndex++) {
          const section = data.sections[sectionIndex];
          
          const createdSection = await tx.devisSection.create({
            data: {
              devisId: devis.id,
              name: section.name,
              materialsTotal: Number(section.materialsTotal) || 0,
              subTotal: Number(section.subTotal) || 0,
              category: section.category || 'DEFAULT',
              order: sectionIndex
            }
          });

          // Pour chaque section, créer les services associés
          if (section.services && section.services.length > 0) {
            for (let serviceIndex = 0; serviceIndex < section.services.length; serviceIndex++) {
              const service = section.services[serviceIndex];
              
              const createdService = await tx.devisService.create({
                data: {
                  sectionId: createdSection.id,
                  name: service.name,
                  description: service.description || '',
                  quantity: Number(service.quantity) || 0,
                  unit: service.unit || '',
                  price: Number(service.price) || 0,
                  tva: Number(service.tva) || 20,
                  category: service.category || 'SERVICE',
                  order: serviceIndex
                }
              });

              // Créer les matériaux pour ce service
              if (service.materials && service.materials.length > 0) {
                for (let materialIndex = 0; materialIndex < service.materials.length; materialIndex++) {
                  const material = service.materials[materialIndex];
                  
                  await tx.devisMaterial.create({
                    data: {
                      serviceId: createdService.id,
                      name: material.name,
                      quantity: Number(material.quantity) || 0,
                      price: Number(material.price) || 0,
                      unit: material.unit || '',
                      reference: material.reference || '',
                      tva: Number(material.tva) || 20,
                      order: materialIndex
                    }
                  });
                }
              }
            }
          }
        }
      }

      return devis;
    });

    return NextResponse.json(createdDevis);
  } catch (error) {
    console.error('Erreur détaillée lors de la création:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du devis',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
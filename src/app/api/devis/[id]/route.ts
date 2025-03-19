import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { DevisUpdateInput } from '@/types/Devis';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Tentative de récupération du devis:', params.id);
    
    // Vérifier si l'ID est valide
    if (!params.id || params.id === 'undefined') {
      console.error('ID de devis invalide:', params.id);
      return NextResponse.json(
        { error: 'ID de devis invalide' },
        { status: 400 }
      );
    }

    // Récupérer le devis avec toutes ses relations en une seule requête
    const devis = await prisma.devis.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            company: true
          }
        },
        prescriber: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        },
        catalog: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        sections: {
          select: {
            id: true,
            name: true,
            category: true,
            materialsTotal: true,
            subTotal: true,
            services: {
              select: {
                id: true,
                name: true,
                description: true,
                quantity: true,
                price: true,
                unit: true,
                tva: true,
                categoryId: true,
                materials: {
                  select: {
                    id: true,
                    name: true,
                    quantity: true,
                    price: true,
                    unit: true,
                    reference: true,
                    tva: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!devis) {
      console.log('Devis non trouvé:', params.id);
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    // Si le devis n'a pas de numéro, générer un numéro temporaire
    if (!devis.number) {
      const tempNumber = `DEVIS-${devis.id.substring(0, 8)}`;
      await prisma.devis.update({
        where: { id: params.id },
        data: { number: tempNumber }
      });
      devis.number = tempNumber;
    }

    console.log('Devis récupéré avec succès:', devis.id, 'Numéro:', devis.number);
    return NextResponse.json(devis);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération du devis:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération du devis',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const devisId = params.id;
    const data = await request.json();
    
    console.log("Données reçues pour la mise à jour:", JSON.stringify(data, null, 2));
    
    // Vérifier si le devis existe
    const existingDevis = await prisma.devis.findUnique({
      where: { id: devisId }
    });
    
    if (!existingDevis) {
      console.error(`Devis avec ID ${devisId} non trouvé`);
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }
    
    // Validation des données requises
    if (!data.clientId) {
      return NextResponse.json(
        { error: "Le clientId est requis" },
        { status: 400 }
      );
    }

    if (!data.catalogId) {
      return NextResponse.json(
        { error: "Le catalogId est requis" },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.sections)) {
      return NextResponse.json(
        { error: "Les sections doivent être un tableau" },
        { status: 400 }
      );
    }
    
    console.log(`Mise à jour du devis ${devisId} - Étape 1: Mise à jour des informations de base`);
    
    // Mettre à jour le devis lui-même d'abord (sans transaction)
    const updatedDevis = await prisma.devis.update({
      where: { id: devisId },
      data: {
        status: data.status,
        clientId: data.clientId,
        catalogId: data.catalogId,
        prescriberId: data.prescriberId,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        paymentMethod: data.paymentMethod,
        pilot: data.pilot,
        devisComments: data.devisComments,
        showDevisComments: data.showDevisComments,
        orderFormComments: data.orderFormComments,
        showOrderFormComments: data.showOrderFormComments,
        showDescriptions: data.showDescriptions,
        projectType: data.projectType || 'AUTRE',
        totalHT: data.totalHT || 0,
        totalTTC: data.totalTTC || 0,
      }
    });
    
    console.log(`Mise à jour du devis ${devisId} - Étape 2: Suppression des sections existantes`);
    
    // Supprimer toutes les sections existantes et leurs contenus
    // Récupérer toutes les sections existantes
    const existingSections = await prisma.devisSection.findMany({
      where: { devisId: devisId },
      select: { id: true }
    });
    
    // Supprimer les sections existantes et leur contenu
    for (const section of existingSections) {
      // 1. Récupérer tous les services de cette section
      const services = await prisma.devisService.findMany({
        where: { sectionId: section.id },
        select: { id: true }
      });
      
      // 2. Pour chaque service, supprimer ses matériaux
      for (const service of services) {
        await prisma.devisMaterial.deleteMany({
          where: { serviceId: service.id }
        });
      }
      
      // 3. Supprimer tous les services de cette section
      await prisma.devisService.deleteMany({
        where: { sectionId: section.id }
      });
    }
    
    // Supprimer toutes les sections
    await prisma.devisSection.deleteMany({
      where: { devisId: devisId }
    });
    
    console.log(`Mise à jour du devis ${devisId} - Étape 3: Création des nouvelles sections`);
    
    // Créer les nouvelles sections
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i];
      
      // Créer une nouvelle section
      const newSection = await prisma.devisSection.create({
        data: {
          devisId: devisId,
          name: section.name,
          materialsTotal: parseFloat(section.materialsTotal) || 0,
          subTotal: parseFloat(section.subTotal) || 0,
          category: section.category || "DEFAULT",
          order: i
        }
      });
      
      // Créer les services pour cette section
      if (section.services && section.services.length > 0) {
        for (let j = 0; j < section.services.length; j++) {
          const service = section.services[j];
          
          // Créer un nouveau service
          const newService = await prisma.devisService.create({
            data: {
              sectionId: newSection.id,
              name: service.name,
              description: service.description || "",
              quantity: parseFloat(service.quantity) || 1,
              unit: service.unit || "m²",
              price: parseFloat(service.price) || 0,
              tva: parseFloat(service.tva) || 20,
              catalogId: data.catalogId,
              categoryId: service.categoryId || null,
              materials: {
                create: Array.isArray(service.materials) ? service.materials.map((material: any) => ({
                  name: material.name,
                  quantity: parseFloat(material.quantity) || 1,
                  price: parseFloat(material.price) || 0,
                  unit: material.unit || "m²",
                  reference: material.reference || "",
                  tva: parseFloat(material.tva) || 20
                })) : []
              }
            }
          });
        }
      }
    }
    
    console.log(`Mise à jour du devis ${devisId} - Étape 4: Récupération du devis mis à jour`);
    
    // Récupérer le devis mis à jour avec toutes ses relations
    const finalDevis = await prisma.devis.findUnique({
      where: { id: devisId },
      include: {
        client: true,
        prescriber: true,
        catalog: true,
        sections: {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Mise à jour du devis ${devisId} terminée avec succès`);
    return NextResponse.json(finalDevis);
  } catch (error) {
    console.error("Erreur détaillée lors de la mise à jour du devis:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la mise à jour du devis", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.devis.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du devis' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Créer le devis
    const devis = await prisma.devis.create({
      data: {
        number: data.number,
        year: new Date().getFullYear(),
        reference: data.reference,
        status: data.status || 'DRAFT',
        clientId: data.clientId,
        catalogId: data.catalogId,
        prescriberId: data.prescriberId,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        paymentMethod: data.paymentMethod,
        pilot: data.pilot,
        projectType: data.projectType || 'AUTRE',
        totalHT: parseFloat(data.totalHT) || 0,
        totalTTC: parseFloat(data.totalTTC) || 0,
        tva: parseFloat(data.tva) || 20,
        sections: {
          create: Array.isArray(data.sections) ? data.sections.map((section: any) => ({
            name: section.name,
            materialsTotal: parseFloat(section.materialsTotal) || 0,
            subTotal: parseFloat(section.subTotal) || 0,
            category: section.category || "DEFAULT",
            services: {
              create: Array.isArray(section.services) ? section.services.map((service: any) => ({
                name: service.name,
                description: service.description || "",
                quantity: parseFloat(service.quantity) || 1,
                price: parseFloat(service.price) || 0,
                unit: service.unit || "m²",
                tva: parseFloat(service.tva) || 20,
                catalogId: data.catalogId,
                categoryId: service.categoryId || null,
                materials: {
                  create: Array.isArray(service.materials) ? service.materials.map((material: any) => ({
                    name: material.name,
                    quantity: parseFloat(material.quantity) || 1,
                    price: parseFloat(material.price) || 0,
                    unit: material.unit || "m²",
                    reference: material.reference || "",
                    tva: parseFloat(material.tva) || 20
                  })) : []
                }
              })) : []
            }
          })) : []
        }
      },
      include: {
        sections: {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(devis);
  } catch (error) {
    console.error("Erreur détaillée:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du devis",
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
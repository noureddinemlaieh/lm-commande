import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEVIS_STATUS } from '@/constants/devisStatus';
import { getNextDevisNumber } from '@/services/devisSequence';
import { generateDevisNumber } from '@/lib/devis';
import { DevisStatus } from '@prisma/client';

// Interfaces TypeScript strictes pour les données reçues
interface DevisMaterialInput {
  name: string;
  quantity?: number;
  price?: number;
  unit?: string;
  reference?: string;
  tva?: number;
  billable?: boolean;
}

interface DevisServiceInput {
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  tva?: number;
  category?: string;
  categoryName?: string;
  materials?: DevisMaterialInput[];
}

interface DevisSectionInput {
  name: string;
  materialsTotal?: number;
  subTotal?: number;
  category?: string;
  services?: DevisServiceInput[];
}

interface DevisInput {
  number: string;
  year: number;
  reference?: string;
  status: DevisStatus;
  clientId: string;
  catalogId: string;
  prescriberId?: string;
  expirationDate?: string | Date;
  paymentMethod?: string;
  pilot?: string;
  projectType?: string;
  devisComments?: string;
  showDevisComments?: boolean;
  orderFormComments?: string;
  showOrderFormComments?: boolean;
  showDescriptions?: boolean;
  tva?: number;
  sections: DevisSectionInput[];
}

export interface DevisCreateInput {
  number: string;
  year: number;
  reference: string;
  status: DevisStatus;
  clientId: string;
  catalogId: string;
  projectType?: string;
  tva?: number;
  // ... autres champs
}

// Fonctions utilitaires pour la validation et la conversion des données
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const safeString = (value: any, defaultValue: string = ''): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return String(value);
};

const safeBoolean = (value: any, defaultValue: boolean = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  return defaultValue;
};

// GET pour récupérer tous les devis avec pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeClient = searchParams.get('includeClient') === 'true';
    const includePrescriber = searchParams.get('includePrescriber') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year') || '', 10) : undefined;
    const search = searchParams.get('search');
    
    // Valider les paramètres de pagination
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;
    const skip = (validPage - 1) * validLimit;
    
    // Construire les filtres
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (year) {
      where.year = year;
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Compter le nombre total de devis pour la pagination
    const totalCount = await prisma.devis.count({ where });
    
    // Récupérer les devis avec pagination
    const devis = await prisma.devis.findMany({
      where,
      include: {
        sections: includeClient ? {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        } : false,
        // Inclure les informations du client si demandé
        client: includeClient ? {
          include: {
            prescriber: includePrescriber
          }
        } : false,
        prescriber: includeClient && includePrescriber,
        catalog: includeClient
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: validLimit
    });
    
    // Retourner les résultats avec les métadonnées de pagination
    return NextResponse.json({
      data: devis,
      pagination: {
        total: totalCount,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(totalCount / validLimit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    );
  }
}

// POST pour créer un nouveau devis
export async function POST(request: Request) {
  try {
    const data = await request.json() as DevisInput;
    console.log('Données reçues dans POST /api/devis:', JSON.stringify(data, null, 2));

    // Vérifier si une référence est fournie, sinon en générer une
    let reference = data.reference;
    if (!reference) {
      try {
        // Essayer d'obtenir une référence depuis l'API de séquence
        const sequenceResponse = await fetch(new URL('/api/devis/sequence', request.url).toString());
        if (sequenceResponse.ok) {
          const sequenceData = await sequenceResponse.json();
          reference = sequenceData.reference;
        } else {
          // Si l'API de séquence échoue, générer une référence basée sur la date
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          reference = `DEVIS-${year}${month}${day}-${random}`;
        }
      } catch (error) {
        console.error("Erreur lors de la génération de la référence:", error);
        // Référence de secours
        reference = `DEVIS-${Date.now()}`;
      }
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

    // Vérifier la structure des sections et services
    for (const section of data.sections) {
      if (!section.name) {
        return NextResponse.json(
          { error: "Chaque section doit avoir un nom" },
          { status: 400 }
        );
      }
      
      // Vérifier si services existe et est un tableau
      if (!Array.isArray(section.services)) {
        return NextResponse.json(
          { error: "Les services d'une section doivent être un tableau" },
          { status: 400 }
        );
      }
      
      for (const service of section.services) {
        if (!service.name) {
          return NextResponse.json(
            { error: "Chaque service doit avoir un nom" },
            { status: 400 }
          );
        }
        
        // Vérifier si materials existe et est un tableau
        if (!Array.isArray(service.materials)) {
          return NextResponse.json(
            { error: "Les matériaux d'un service doivent être un tableau" },
            { status: 400 }
          );
        }
      }
    }

    // Déterminer le numéro et l'année du devis si non fournis
    const currentYear = new Date().getFullYear();
    const year = data.year || currentYear;
    let number = data.number;

    if (!number) {
      try {
        // Obtenir le dernier numéro de devis pour cette année
        const lastDevis = await prisma.devis.findFirst({
          where: {
            AND: [
              { year: year },
              { catalogId: data.catalogId }
            ]
          },
          orderBy: { number: 'desc' },
          select: { number: true }
        });
        
        number = lastDevis ? (parseInt(lastDevis.number) + 1).toString() : "1";
      } catch (error) {
        console.error("Erreur lors de la détermination du numéro de devis:", error);
        number = "1"; // Valeur par défaut
      }
    }

    console.log(`Création du devis avec numéro ${number} et année ${year}`);

    // Calculer les totaux
    let totalHT = 0;
    let totalTTC = 0;
    const tva = safeNumber(data.tva, 20);

    for (const section of data.sections) {
      if (section.services) {
        for (const service of section.services) {
          const serviceHT = safeNumber(service.price) * safeNumber(service.quantity);
          const serviceTVA = safeNumber(service.tva, tva);
          const serviceTTC = serviceHT * (1 + serviceTVA / 100);
          
          totalHT += serviceHT;
          totalTTC += serviceTTC;

          if (service.materials) {
            for (const material of service.materials) {
              if (material.billable) {
                const materialHT = safeNumber(material.price) * safeNumber(material.quantity);
                const materialTVA = safeNumber(material.tva, tva);
                const materialTTC = materialHT * (1 + materialTVA / 100);
                
                totalHT += materialHT;
                totalTTC += materialTTC;
              }
            }
          }
        }
      }
    }

    // Créer le devis avec la référence générée
    const devis = await prisma.devis.create({
      data: {
        number: safeString(number),
        year: safeNumber(year),
        reference: safeString(reference),
        status: data.status || 'DRAFT' as DevisStatus,
        clientId: safeString(data.clientId),
        catalogId: safeString(data.catalogId),
        prescriberId: data.prescriberId ? safeString(data.prescriberId) : undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        paymentMethod: safeString(data.paymentMethod, 'Virement bancaire'),
        pilot: safeString(data.pilot, 'Noureddine MLAIEH'),
        projectType: safeString(data.projectType, 'AUTRE'),
        devisComments: data.devisComments ? safeString(data.devisComments) : null,
        showDevisComments: safeBoolean(data.showDevisComments, true),
        orderFormComments: data.orderFormComments ? safeString(data.orderFormComments) : null,
        showOrderFormComments: safeBoolean(data.showOrderFormComments, true),
        showDescriptions: safeBoolean(data.showDescriptions, false),
        totalHT: totalHT,
        totalTTC: totalTTC,
        tva: tva,
        // Créer les sections
        sections: {
          create: data.sections.map((section: DevisSectionInput, sectionIndex: number) => ({
            name: safeString(section.name),
            materialsTotal: safeNumber(section.materialsTotal),
            subTotal: safeNumber(section.subTotal), 
            category: safeString(section.category, 'DEFAULT'),
            order: sectionIndex, // Utiliser l'index comme ordre par défaut
            // Créer les services (anciennement prestations)
            services: {
              create: Array.isArray(section.services) ? section.services.map((service: DevisServiceInput, serviceIndex: number) => ({
                name: safeString(service.name),
                description: safeString(service.description),
                quantity: safeNumber(service.quantity),
                unit: safeString(service.unit),
                price: safeNumber(service.price),
                tva: safeNumber(service.tva, 20),
                order: serviceIndex,
                category: safeString(service.category || service.categoryName, 'SERVICE'),
                // Créer les matériaux
                materials: {
                  create: Array.isArray(service.materials) ? service.materials.map((material: DevisMaterialInput, materialIndex: number) => ({
                    name: safeString(material.name),
                    quantity: safeNumber(material.quantity),
                    price: safeNumber(material.price),
                    unit: safeString(material.unit),
                    reference: safeString(material.reference),
                    tva: safeNumber(material.tva, 20),
                    order: materialIndex,
                    billable: safeBoolean(material.billable, false)
                  })) : []
                }
              })) : []
            }
          }))
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

    console.log(`Devis créé avec succès: ${devis.id}`);
    return NextResponse.json(devis);
  } catch (error) {
    console.error("Erreur détaillée lors de la création du devis:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la création du devis",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    
    // Validation de l'ID
    if (!params.id) {
      return NextResponse.json(
        { error: "L'ID du devis est requis" },
        { status: 400 }
      );
    }
    
    // Vérifier que le devis existe
    const existingDevis = await prisma.devis.findUnique({
      where: { id: params.id }
    });
    
    if (!existingDevis) {
      return NextResponse.json(
        { error: "Devis non trouvé" },
        { status: 404 }
      );
    }
    
    const devis = await prisma.devis.update({
      where: { id: params.id },
      data: {
        status: body.status as DevisStatus,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        paymentMethod: body.paymentMethod ? safeString(body.paymentMethod) : null,
        projectType: body.projectType ? safeString(body.projectType) : undefined,
        devisComments: body.devisComments ? safeString(body.devisComments) : undefined,
        showDevisComments: typeof body.showDevisComments === 'boolean' ? body.showDevisComments : undefined,
        orderFormComments: body.orderFormComments ? safeString(body.orderFormComments) : undefined,
        showOrderFormComments: typeof body.showOrderFormComments === 'boolean' ? body.showOrderFormComments : undefined,
        showDescriptions: typeof body.showDescriptions === 'boolean' ? body.showDescriptions : undefined,
        sections: {
          deleteMany: {},
          create: Array.isArray(body.sections) ? body.sections.map((section: any, sectionIndex: number) => ({
            name: safeString(section.name),
            materialsTotal: safeNumber(section.materialsTotal),
            subTotal: safeNumber(section.subTotal),
            order: sectionIndex,
            category: safeString(section.category, 'DEFAULT'),
            services: {
              create: Array.isArray(section.prestations || section.services) ? 
                (section.prestations || section.services).map((service: any, serviceIndex: number) => ({
                  name: safeString(service.name),
                  description: safeString(service.description),
                  quantity: safeNumber(service.quantity),
                  unit: safeString(service.unit),
                  price: safeNumber(service.unitPrice || service.price),
                  tva: safeNumber(service.tva, 20),
                  order: serviceIndex,
                  category: safeString(service.category || service.categoryName, 'SERVICE'),
                  materials: {
                    create: Array.isArray(service.materials) ? service.materials.map((material: any, materialIndex: number) => ({
                      name: safeString(material.name),
                      quantity: safeNumber(material.quantity),
                      price: safeNumber(material.price),
                      unit: safeString(material.unit),
                      reference: safeString(material.reference),
                      tva: safeNumber(material.tva, 20),
                      order: materialIndex,
                      billable: safeBoolean(material.billable, false)
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
    console.error('Error updating devis:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update devis',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
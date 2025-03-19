import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/devis-templates
export async function GET() {
  try {
    const templates = await prisma.devisTemplate.findMany({
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!templates || templates.length === 0) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des modèles' },
      { status: 500 }
    );
  }
}

// POST /api/devis-templates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, sections } = body;

    console.log('Données reçues:', JSON.stringify(body, null, 2));

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Le nom et la description sont requis' },
        { status: 400 }
      );
    }

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Les sections doivent être un tableau' },
        { status: 400 }
      );
    }

    const template = await prisma.devisTemplate.create({
      data: {
        name,
        description,
        sections: {
          create: sections.map((section: any) => {
            console.log('Traitement de la section:', section);
            
            if (!section.name) {
              throw new Error('Le nom de la section est requis');
            }

            return {
              name: section.name,
              services: {
                create: (section.services || []).map((service: any) => {
                  console.log('Traitement du service:', service);
                  
                  if (!service.name) {
                    throw new Error('Le nom du service est requis');
                  }

                  return {
                    name: service.name,
                    description: service.description || '',
                    price: service.price || 0,
                    quantity: service.quantity || 1,
                    unit: service.unit || 'm²',
                    tva: service.tva || 20,
                    materials: {
                      create: (service.materials || []).map((material: any) => {
                        console.log('Traitement du matériau:', material);
                        
                        if (!material.name) {
                          throw new Error('Le nom du matériau est requis');
                        }

                        return {
                          name: material.name,
                          price: material.price || 0,
                          quantity: material.quantity || 1,
                          unit: material.unit || 'm²',
                          tva: material.tva || 20,
                          reference: material.reference || null
                        };
                      })
                    }
                  };
                })
              }
            };
          })
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

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Erreur détaillée lors de la création du modèle:', error);
    
    // Si c'est une erreur Prisma
    if (error.code) {
      return NextResponse.json(
        { 
          error: 'Erreur lors de la création du modèle',
          code: error.code,
          message: error.message,
          meta: error.meta
        },
        { status: 400 }
      );
    }

    // Pour les autres types d'erreurs
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du modèle',
        message: error.message
      },
      { status: 500 }
    );
  }
} 
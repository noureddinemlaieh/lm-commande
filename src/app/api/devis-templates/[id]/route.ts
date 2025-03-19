import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/devis-templates/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.devisTemplate.findUnique({
      where: { id: params.id },
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

    if (!template) {
      return NextResponse.json(
        { error: 'Modèle non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erreur lors de la récupération du modèle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du modèle' },
      { status: 500 }
    );
  }
}

// PUT /api/devis-templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, sections } = body;

    const template = await prisma.devisTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        sections: {
          deleteMany: {},
          create: sections.map((section: any) => ({
            name: section.name,
            services: {
              create: section.services.map((service: any) => ({
                name: service.name,
                description: service.description || '',
                price: service.price || 0,
                quantity: service.quantity || 1,
                unit: service.unit || 'm²',
                tva: service.tva || 20,
                materials: {
                  create: service.materials.map((material: any) => ({
                    name: material.name,
                    price: material.price || 0,
                    quantity: material.quantity || 1,
                    unit: material.unit || 'm²',
                    tva: material.tva || 20,
                    reference: material.reference || null
                  }))
                }
              }))
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

    return NextResponse.json(template);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du modèle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du modèle' },
      { status: 500 }
    );
  }
}

// DELETE /api/devis-templates/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Supprimer d'abord tous les matériaux des services
    await prisma.devisTemplateMaterial.deleteMany({
      where: {
        service: {
          section: {
            templateId: params.id
          }
        }
      }
    });

    // Puis supprimer tous les services des sections
    await prisma.devisTemplateService.deleteMany({
      where: {
        section: {
          templateId: params.id
        }
      }
    });

    // Puis supprimer toutes les sections
    await prisma.devisTemplateSection.deleteMany({
      where: {
        templateId: params.id
      }
    });

    // Enfin, supprimer le modèle
    await prisma.devisTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Modèle supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du modèle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du modèle' },
      { status: 500 }
    );
  }
} 
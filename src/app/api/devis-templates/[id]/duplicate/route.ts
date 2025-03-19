import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
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

    // Créer une copie du modèle avec un nouveau nom
    const duplicatedTemplate = await prisma.devisTemplate.create({
      data: {
        name: `${template.name} (copie)`,
        description: template.description,
        sections: {
          create: template.sections.map(section => ({
            name: section.name,
            services: {
              create: section.services.map(service => ({
                name: service.name,
                description: service.description || '',
                price: service.price || 0,
                quantity: service.quantity || 1,
                unit: service.unit || 'm²',
                tva: service.tva || 20,
                materials: {
                  create: service.materials.map(material => ({
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

    return NextResponse.json(duplicatedTemplate);
  } catch (error) {
    console.error('Erreur lors de la duplication du modèle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la duplication du modèle' },
      { status: 500 }
    );
  }
} 
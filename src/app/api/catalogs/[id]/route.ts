import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Tentative de récupération du catalogue:', params.id);
    
    // Vérifier si l'ID est valide
    if (!params.id || params.id === 'undefined') {
      console.error('ID de catalogue invalide:', params.id);
      return NextResponse.json(
        { error: 'ID de catalogue invalide' },
        { status: 400 }
      );
    }
    
    const catalog = await prisma.catalog.findUnique({
      where: {
        id: params.id,
      },
      include: {
        categories: {
          include: {
            services: {
              include: {
                materials: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!catalog) {
      console.error('Catalogue non trouvé:', params.id);
      return NextResponse.json({ error: 'Catalogue non trouvé' }, { status: 404 });
    }

    console.log('Catalogue récupéré avec succès:', catalog.id, 'Nom:', catalog.name);
    console.log('Nombre de catégories dans le catalogue:', catalog.categories.length);
    console.log('Catégories du catalogue:', catalog.categories.map(cat => ({ id: cat.id, name: cat.name })));
    
    return NextResponse.json(catalog);
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération du catalogue:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération du catalogue',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si le catalogue existe
    const catalog = await prisma.catalog.findUnique({
      where: {
        id: params.id,
      },
      include: {
        categories: {
          include: {
            services: {
              include: {
                materials: true
              }
            }
          }
        },
        products: true
      }
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Catalogue non trouvé' }, { status: 404 });
    }

    // Vérifier si le catalogue est référencé par des devis
    const devisCount = await prisma.devis.count({
      where: {
        catalogId: params.id
      }
    });

    if (devisCount > 0) {
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer ce catalogue', 
          details: `Ce catalogue est utilisé par ${devisCount} devis. Veuillez d'abord supprimer ou modifier ces devis.` 
        }, 
        { status: 400 }
      );
    }

    // Utiliser une transaction pour garantir l'intégrité des données
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les associations avec les produits (table CatalogProduct)
      if (catalog.products && catalog.products.length > 0) {
        await tx.catalogProduct.deleteMany({
          where: {
            catalogId: params.id
          }
        });
      }

      // 2. Supprimer les matériaux des services du catalogue
      for (const category of catalog.categories) {
        for (const service of category.services) {
          if (service.materials && service.materials.length > 0) {
            await tx.catalogMaterial.deleteMany({
              where: {
                serviceId: service.id
              }
            });
          }
        }
      }

      // 3. Supprimer les services des catégories du catalogue
      for (const category of catalog.categories) {
        if (category.services && category.services.length > 0) {
          await tx.catalogService.deleteMany({
            where: {
              categoryId: category.id
            }
          });
        }
      }

      // 4. Supprimer les catégories du catalogue
      if (catalog.categories && catalog.categories.length > 0) {
        await tx.catalogCategory.deleteMany({
          where: {
            catalogId: params.id
          }
        });
      }

      // 5. Finalement, supprimer le catalogue lui-même
      await tx.catalog.delete({
        where: {
          id: params.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du catalogue', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Vérifier si le catalogue existe
    const catalog = await prisma.catalog.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!catalog) {
      return NextResponse.json({ error: 'Catalogue non trouvé' }, { status: 404 });
    }

    // Mettre à jour le catalogue
    const updatedCatalog = await prisma.catalog.update({
      where: {
        id: params.id,
      },
      data,
    });

    return NextResponse.json(updatedCatalog);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du catalogue:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du catalogue' },
      { status: 500 }
    );
  }
} 
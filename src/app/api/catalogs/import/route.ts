import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ValidatedProductData } from '@/types/ImportTypes';
import { MaterialConflict } from '@/components/MaterialImportVerification';
import { ServiceConflict } from '@/components/CatalogItemVerification';

const prisma = new PrismaClient();

// Interface pour les données du catalogue
interface CatalogData {
  name: string;
  description?: string;
  materials: ValidatedProductData[];
  services: ValidatedProductData[];
  materialResolutions?: MaterialConflict[];
  serviceResolutions?: ServiceConflict[];
}

export async function POST(request: Request) {
  try {
    // Récupérer les données brutes de la requête
    const requestText = await request.text();
    console.log('Données brutes reçues:', requestText);

    // Parser les données JSON
    let data: CatalogData;
    try {
      data = JSON.parse(requestText);
    } catch (e) {
      console.error('Erreur lors du parsing des données JSON:', e);
      return NextResponse.json(
        { error: 'Données JSON invalides', details: e instanceof Error ? e.message : String(e) },
        { status: 400 }
      );
    }

    console.log('Données reçues pour importation (résumé):', {
      name: data.name,
      description: data.description,
      materialsCount: data.materials?.length || 0,
      servicesCount: data.services?.length || 0,
      materialResolutionsCount: data.materialResolutions?.length || 0,
      serviceResolutionsCount: data.serviceResolutions?.length || 0
    });

    // Validation des données du catalogue
    if (!data.name) {
      return NextResponse.json(
        { error: 'Le nom du catalogue est requis' },
        { status: 400 }
      );
    }

    // Vérifier que les données contiennent des matériaux ou des services
    if ((!data.materials || data.materials.length === 0) && (!data.services || data.services.length === 0)) {
      return NextResponse.json(
        { error: 'Aucun élément à importer (ni matériaux ni prestations)' },
        { status: 400 }
      );
    }

    // Approche simplifiée : créer directement le catalogue et les produits sans gérer les conflits
    try {
      // Créer le catalogue
      const catalog = await prisma.catalog.create({
        data: {
          name: data.name,
          description: data.description || null,
        },
      });

      console.log('Catalogue créé:', catalog);

      // Traiter les matériaux
      const processedMaterials: any[] = [];
      if (data.materials && data.materials.length > 0) {
        for (const material of data.materials) {
          try {
            // Créer le matériau
            const newMaterial = await prisma.product.create({
              data: {
                name: material.name,
                description: material.description || null,
                category: 'MATERIAL',
                cost: material.cost || 0,
                unit: material.unit || null,
                reference: material.reference || null,
                sellingPrice: material.sellingPrice || 0,
              },
            });
            
            // Associer au catalogue
            await prisma.catalogProduct.create({
              data: {
                catalogId: catalog.id,
                productId: newMaterial.id,
              },
            });
            
            processedMaterials.push(newMaterial);
            console.log('Matériau créé:', newMaterial.name);
          } catch (error) {
            console.error('Erreur lors de la création du matériau:', material.name, error);
          }
        }
      }

      // Traiter les services
      const processedServices: any[] = [];
      if (data.services && data.services.length > 0) {
        for (const service of data.services) {
          try {
            // Créer le service
            const newService = await prisma.product.create({
              data: {
                name: service.name,
                description: service.description || null,
                category: 'SERVICE',
                cost: service.cost || 0,
                unit: service.unit || null,
                reference: service.reference || null,
                sellingPrice: service.sellingPrice || 0,
              },
            });
            
            // Associer au catalogue
            await prisma.catalogProduct.create({
              data: {
                catalogId: catalog.id,
                productId: newService.id,
              },
            });
            
            processedServices.push(newService);
            console.log('Service créé:', newService.name);
          } catch (error) {
            console.error('Erreur lors de la création du service:', service.name, error);
          }
        }
      }

      console.log('Importation terminée:', {
        catalogId: catalog.id,
        materialsCount: processedMaterials.length,
        servicesCount: processedServices.length
      });

      return NextResponse.json({
        success: true,
        message: 'Catalogue importé avec succès',
        data: {
          catalog,
          materialsCount: processedMaterials.length,
          servicesCount: processedServices.length,
          materials: processedMaterials.map(m => ({ id: m.id, name: m.name })),
          services: processedServices.map(s => ({ id: s.id, name: s.name })),
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'importation du catalogue:', error);
      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'importation du catalogue', 
          details: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur globale lors de l\'importation du catalogue:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'importation du catalogue', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
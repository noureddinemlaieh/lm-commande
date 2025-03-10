import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ProductCategory } from '@prisma/client';

// Interface simplifiée pour les données du produit
interface ProductData {
  name: string;
  description?: string;
  category: 'MATERIAL' | 'SERVICE';
  cost: number;
  unit?: string;
  reference?: string;
  sellingPrice: number;
}

// Interface pour les données du catalogue
interface CatalogData {
  name: string;
  description?: string;
  materials: ProductData[];
  services: ProductData[];
  categories?: string[];
}

export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    const data: CatalogData = await request.json();

    console.log('Données reçues pour importation:', {
      name: data.name,
      description: data.description,
      materialsCount: data.materials?.length || 0,
      servicesCount: data.services?.length || 0,
      categoriesCount: data.categories?.length || 0
    });

    // Validation des données du catalogue
    if (!data.name) {
      return NextResponse.json(
        { error: 'Le nom du catalogue est requis' },
        { status: 400 }
      );
    }

    // Vérifier que les données contiennent des matériaux ou des prestations
    if ((!data.materials || data.materials.length === 0) && (!data.services || data.services.length === 0)) {
      return NextResponse.json(
        { error: 'Aucun élément à importer (ni matériaux ni prestations)' },
        { status: 400 }
      );
    }

    // Créer le catalogue
    const catalog = await prisma.catalog.create({
      data: {
        name: data.name,
        description: data.description || null,
      },
    });

    console.log('Catalogue créé:', catalog.id);

    // Utiliser les catégories spécifiées dans le fichier d'importation
    // ou créer une catégorie "Général" si aucune n'est spécifiée
    const categories = data.categories && data.categories.length > 0 
      ? data.categories 
      : ["Général"];

    console.log('Catégories à créer:', categories);

    // Créer les catégories
    const createdCategories: any[] = [];
    for (let i = 0; i < categories.length; i++) {
      const category = await prisma.catalogCategory.create({
        data: {
          name: categories[i],
          description: `Catégorie ${categories[i]}`,
          order: i,
          catalogId: catalog.id,
        }
      });
      createdCategories.push(category);
    }

    console.log('Catégories créées:', createdCategories.length);

    // Créer un dictionnaire pour stocker les matériaux créés
    const materialsMap = new Map();
    const processedMaterials: any[] = [];

    // Créer les matériaux
    if (data.materials && data.materials.length > 0) {
      for (const material of data.materials) {
        try {
          // Créer le matériau dans la table Product
          const newProduct = await prisma.product.create({
            data: {
              name: material.name,
              description: material.description || null,
              category: ProductCategory.MATERIAL,
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
              productId: newProduct.id,
            },
          });
          
          // Stocker le matériau dans le dictionnaire pour une utilisation ultérieure
          materialsMap.set(material.name, {
            product: newProduct,
            data: material
          });
          
          processedMaterials.push(newProduct);
        } catch (error) {
          console.error('Erreur lors de la création du matériau:', material.name, error);
        }
      }
    }

    console.log('Matériaux créés:', processedMaterials.length);

    // Créer les services et les associer aux catégories
    const processedServices: any[] = [];
    if (data.services && data.services.length > 0) {
      for (let i = 0; i < data.services.length; i++) {
        const service = data.services[i];
        try {
          // Déterminer la catégorie pour ce service
          const categoryIndex = i % createdCategories.length;
          const category = createdCategories[categoryIndex];
          
          // Créer le service dans la table Product
          const newProduct = await prisma.product.create({
            data: {
              name: service.name,
              description: service.description || null,
              category: ProductCategory.SERVICE,
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
              productId: newProduct.id,
            },
          });

          // Créer un service dans la catégorie
          const newService = await prisma.catalogService.create({
            data: {
              name: service.name,
              description: service.description || null,
              categoryId: category.id,
              price: service.sellingPrice || 0,
              quantity: 1,
              unit: service.unit || null,
              order: Math.floor(i / createdCategories.length),
            },
          });

          // Associer des matériaux à ce service
          // Nous allons associer 2-4 matériaux aléatoires à chaque service
          const materialsToAssociate: any[] = [];
          if (materialsMap.size > 0) {
            // Déterminer combien de matériaux associer (entre 2 et 4, ou moins si pas assez disponibles)
            const numMaterialsToAssociate = Math.min(Math.floor(Math.random() * 3) + 2, materialsMap.size);
            
            // Convertir la Map en tableau pour pouvoir sélectionner des éléments aléatoirement
            const materialsArray = Array.from(materialsMap.values());
            
            // Sélectionner des matériaux aléatoires
            const selectedIndices = new Set();
            while (selectedIndices.size < numMaterialsToAssociate) {
              const randomIndex = Math.floor(Math.random() * materialsArray.length);
              selectedIndices.add(randomIndex);
            }
            
            // Ajouter les matériaux sélectionnés à la liste
            for (const index of selectedIndices) {
              materialsToAssociate.push(materialsArray[Number(index)]);
            }
          }

          // Créer les matériaux associés à ce service
          for (const materialObj of materialsToAssociate) {
            const material = materialObj.data;
            await prisma.catalogMaterial.create({
              data: {
                name: material.name,
                description: material.description || null,
                serviceId: newService.id,
                quantity: Math.floor(Math.random() * 5) + 1, // Quantité aléatoire entre 1 et 5
                unit: material.unit || null,
                price: material.sellingPrice || 0,
                reference: material.reference || null,
                toChoose: Math.random() > 0.8, // 20% de chance d'être marqué comme "à choisir"
              },
            });
          }
          
          processedServices.push(newProduct);
        } catch (error) {
          console.error('Erreur lors de la création du service:', service.name, error);
        }
      }
    }

    console.log('Services créés:', processedServices.length);

    console.log('Importation terminée avec succès:', {
      catalogId: catalog.id,
      materialsCount: processedMaterials.length,
      servicesCount: processedServices.length,
      categoriesCount: createdCategories.length
    });

    return NextResponse.json({
      success: true,
      message: 'Catalogue importé avec succès',
      data: {
        catalog,
        materialsCount: processedMaterials.length,
        servicesCount: processedServices.length,
        categoriesCount: createdCategories.length,
      },
    });
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
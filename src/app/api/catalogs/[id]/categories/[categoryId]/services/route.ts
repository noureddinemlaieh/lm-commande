import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const catalogId = params.id;
    const categoryId = params.categoryId;

    if (!catalogId || !categoryId) {
      return NextResponse.json(
        { error: 'ID du catalogue ou de la catégorie non fourni' },
        { status: 400 }
      );
    }

    console.log(`Tentative d'ajout d'un service à la catégorie ${categoryId} du catalogue ${catalogId}`);

    // Récupérer les données du service
    const data = await request.json();
    
    if (!data.name || data.price === undefined) {
      return NextResponse.json(
        { error: 'Le nom et le prix du service sont obligatoires' },
        { status: 400 }
      );
    }

    // Vérifier si la catégorie existe
    const category = await prisma.catalogCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    // Créer le service
    const service = await prisma.catalogService.create({
      data: {
        name: data.name,
        description: data.description || '',
        price: data.price,
        quantity: data.quantity || 1,
        unit: data.unit || '',
        categoryId: categoryId,
        order: 0, // Ordre par défaut
      },
    });

    console.log(`Service créé avec succès: ${service.id}`);

    // Si le service a des matériaux, les ajouter
    if (data.materials && Array.isArray(data.materials) && data.materials.length > 0) {
      console.log(`Ajout de ${data.materials.length} matériaux au service:`, JSON.stringify(data.materials));
      
      // Utiliser Promise.all pour ajouter tous les matériaux en parallèle
      const materialPromises = data.materials.map(async (material) => {
        try {
          if (!material || typeof material !== 'object') {
            console.warn('Matériau invalide (pas un objet):', material);
            return null;
          }
          
          console.log('Traitement du matériau:', material);
          
          // Vérifier les propriétés requises
          if (!material.name) {
            console.warn('Matériau sans nom ignoré:', material);
            return null;
          }
          
          // Préparer les données du matériau
          const materialData = {
            name: material.name,
            quantity: typeof material.quantity === 'number' ? material.quantity : 1,
            price: typeof material.price === 'number' ? material.price : 0,
            unit: material.unit || '',
            serviceId: service.id,
            reference: material.reference || '',
          };
          
          console.log('Création du matériau avec les données:', materialData);
          
          // Créer le matériau dans la base de données
          const createdMaterial = await prisma.catalogMaterial.create({
            data: materialData,
          });
          
          console.log('Matériau créé avec succès:', createdMaterial);
          return createdMaterial;
        } catch (error) {
          console.error('Erreur lors de la création du matériau:', error);
          return null;
        }
      });
      
      try {
        // Attendre que tous les matériaux soient créés
        const createdMaterials = await Promise.all(materialPromises);
        const validMaterials = createdMaterials.filter(Boolean);
        console.log(`${validMaterials.length} matériaux créés avec succès sur ${data.materials.length}`);
        
        if (validMaterials.length < data.materials.length) {
          console.warn(`Attention: ${data.materials.length - validMaterials.length} matériaux n'ont pas pu être créés`);
        }
      } catch (error) {
        console.error('Erreur lors de la création des matériaux:', error);
      }
    } else {
      console.log('Aucun matériau à ajouter au service');
    }

    // Récupérer le service avec ses matériaux
    const serviceWithMaterials = await prisma.catalogService.findUnique({
      where: {
        id: service.id,
      },
      include: {
        materials: true,
      },
    });

    if (!serviceWithMaterials) {
      console.error(`Service ${service.id} introuvable après sa création`);
      return NextResponse.json(
        { error: 'Service introuvable après sa création' },
        { status: 500 }
      );
    }

    console.log(`Service récupéré avec ${serviceWithMaterials.materials.length} matériaux:`, 
      serviceWithMaterials.materials.map(m => ({ id: m.id, name: m.name, quantity: m.quantity }))
    );

    return NextResponse.json(serviceWithMaterials);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du service:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du service', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; categoryId: string } }
) {
  try {
    const catalogId = params.id;
    const categoryId = params.categoryId;

    if (!catalogId || !categoryId) {
      return NextResponse.json(
        { error: 'ID du catalogue ou de la catégorie non fourni' },
        { status: 400 }
      );
    }

    console.log(`Récupération des services de la catégorie ${categoryId} du catalogue ${catalogId}`);

    // Récupérer les services de la catégorie
    const services = await prisma.catalogService.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        materials: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    );
  }
} 
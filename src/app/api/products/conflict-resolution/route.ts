import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ValidatedProductData } from '@/types/ImportTypes';

const prisma = new PrismaClient();

interface ConflictResolution {
  importMaterial: ValidatedProductData;
  existingMaterial: {
    id: string;
    name: string;
    description: string | null;
    category: 'SERVICE' | 'MATERIAL';
    cost: number;
    unit: string | null;
    reference: string | null;
    sellingPrice: number;
  };
  resolution: 'import' | 'skip' | 'update';
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!Array.isArray(data.resolutions)) {
      return NextResponse.json(
        { error: 'Format de données invalide. Attendu: { resolutions: ConflictResolution[] }' },
        { status: 400 }
      );
    }
    
    const resolutions: ConflictResolution[] = data.resolutions;
    const results = {
      updated: 0,
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Utiliser une transaction pour garantir l'intégrité des données
    await prisma.$transaction(async (tx) => {
      for (const resolution of resolutions) {
        try {
          const { importMaterial, existingMaterial, resolution: action } = resolution;
          
          switch (action) {
            case 'update':
              // Mettre à jour le matériau existant
              await tx.product.update({
                where: { id: existingMaterial.id },
                data: {
                  name: importMaterial.name,
                  description: importMaterial.description,
                  cost: importMaterial.cost,
                  unit: importMaterial.unit,
                  reference: importMaterial.reference,
                  sellingPrice: importMaterial.sellingPrice
                }
              });
              results.updated++;
              break;
              
            case 'import':
              // Créer un nouveau matériau
              await tx.product.create({
                data: {
                  name: importMaterial.name,
                  description: importMaterial.description,
                  category: importMaterial.category,
                  cost: importMaterial.cost,
                  unit: importMaterial.unit,
                  reference: importMaterial.reference,
                  sellingPrice: importMaterial.sellingPrice
                }
              });
              results.created++;
              break;
              
            case 'skip':
              // Ignorer ce matériau
              results.skipped++;
              break;
              
            default:
              throw new Error(`Action non reconnue: ${action}`);
          }
        } catch (error) {
          console.error('Erreur lors du traitement d\'une résolution:', error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Erreur inconnue';
          results.errors.push(errorMessage);
        }
      }
    });
    
    return NextResponse.json({
      message: `Résolution des conflits terminée. ${results.updated} mis à jour, ${results.created} créés, ${results.skipped} ignorés.`,
      results
    });
  } catch (error) {
    console.error('Erreur lors de la résolution des conflits:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la résolution des conflits',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { PrismaClient, ProductCategory } from '@prisma/client';
import * as XLSX from 'xlsx';
import { RawExcelProductData, ValidatedProductData, ImportResult } from '@/types/ImportTypes';

const prisma = new PrismaClient();

// Fonction pour valider et convertir les données
function validateAndConvertData(row: RawExcelProductData): ValidatedProductData {
  try {
    // Log pour déboguer
    console.log('Données reçues:', row);

    // Vérification et conversion du nom
    if (!row.name || typeof row.name !== 'string' && typeof row.name !== 'number') {
      throw new Error('Le nom est obligatoire');
    }
    const name = String(row.name).trim();
    if (name.length === 0) {
      throw new Error('Le nom ne peut pas être vide');
    }

    // Vérification et conversion de la catégorie
    if (!row.category) {
      throw new Error('La catégorie est obligatoire');
    }
    const categoryStr = String(row.category).toUpperCase();
    if (categoryStr !== 'SERVICE' && categoryStr !== 'MATERIAL') {
      throw new Error(`Catégorie invalide pour le produit "${name}": ${row.category}`);
    }
    const category = categoryStr as 'SERVICE' | 'MATERIAL';

    // Vérification et conversion des champs string
    const description = row.description ? String(row.description).trim() : null;
    const unit = row.unit ? String(row.unit).trim() : null;
    
    // Vérification et conversion du coût
    if (row.cost === undefined || row.cost === null) {
      throw new Error(`Le coût est obligatoire pour le produit "${name}"`);
    }
    
    let cost: number;
    if (typeof row.cost === 'number') {
      cost = row.cost;
    } else {
      const costStr = String(row.cost).replace(',', '.');
      cost = parseFloat(costStr);
      if (isNaN(cost)) {
        throw new Error(`Coût invalide pour le produit "${name}": ${row.cost}`);
      }
    }

    // Vérification et conversion du prix de vente
    if (row.sellingPrice === undefined || row.sellingPrice === null) {
      throw new Error(`Le prix de vente est obligatoire pour le produit "${name}"`);
    }
    
    let sellingPrice: number;
    if (typeof row.sellingPrice === 'number') {
      sellingPrice = row.sellingPrice;
    } else {
      const sellingPriceStr = String(row.sellingPrice).replace(',', '.');
      sellingPrice = parseFloat(sellingPriceStr);
      if (isNaN(sellingPrice)) {
        throw new Error(`Prix de vente invalide pour le produit "${name}": ${row.sellingPrice}`);
      }
    }

    // Conversion de la référence
    let reference: string | null = null;
    if (row.reference !== undefined && row.reference !== null) {
      reference = String(row.reference).trim();
    }

    const validatedData: ValidatedProductData = {
      name,
      description,
      category,
      cost,
      unit,
      reference,
      sellingPrice
    };

    // Log des données validées
    console.log('Données validées:', validatedData);

    return validatedData;
  } catch (error) {
    console.error('Erreur de validation:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  // Créer une transaction Prisma
  const transaction = await prisma.$transaction(async (tx) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('Aucun fichier n\'a été fourni');
      }

      // Lire le fichier Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Vérifier que le workbook contient au moins une feuille
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Le fichier Excel ne contient aucune feuille');
      }
      
      // Prendre la première feuille
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir en JSON
      const data = XLSX.utils.sheet_to_json(worksheet) as RawExcelProductData[];
      
      // Vérifier que des données ont été extraites
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Aucune donnée trouvée dans le fichier Excel');
      }

      console.log('Données parsées:', data);

      const results: ImportResult = {
        success: 0,
        errors: [],
        total: data.length,
        createdProducts: []
      };

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          const validatedData = validateAndConvertData(row);
          console.log('Tentative de création du produit:', validatedData);

          // Utiliser la transaction pour créer le produit
          const createdProduct = await tx.product.create({
            data: validatedData
          });

          console.log('Produit créé:', createdProduct);
          results.createdProducts.push(createdProduct);
          results.success++;
        } catch (error) {
          console.error('Erreur lors de la création:', error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : `Erreur inconnue à la ligne ${i + 2}`;
          results.errors.push(`Ligne ${i + 2}: ${errorMessage}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Erreur dans la transaction:', error);
      throw error;
    }
  });

  // Vérifier les résultats de la transaction
  if (transaction.success > 0) {
    return NextResponse.json({
      message: `Importation terminée. ${transaction.success} produits importés sur ${transaction.total}`,
      results: {
        success: transaction.success,
        total: transaction.total,
        errors: transaction.errors,
        products: transaction.createdProducts
      }
    });
  } else {
    return NextResponse.json(
      { 
        error: 'Aucun produit n\'a été importé',
        details: transaction.errors
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Récupérer tous les produits de la base de données
    const products = await prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Préparer les données pour Excel en respectant exactement le format d'importation
    const workbook = XLSX.utils.book_new();
    
    // Transformer les produits en format tableau pour Excel
    // Utiliser exactement les mêmes noms de colonnes que dans l'importation
    const worksheetData = products.map(product => ({
      reference: product.reference || '',
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      unit: product.unit || '',
      cost: product.cost || 0,
      sellingPrice: product.sellingPrice || 0
    }));
    
    // Créer une feuille de calcul avec les données
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
    
    // Convertir le classeur en buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Créer une réponse avec le contenu Excel
    const response = new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=products-export.xlsx',
      },
    });
    
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'exportation des produits:', error);
    return NextResponse.json(
      { error: 'Échec de l\'exportation des produits' },
      { status: 500 }
    );
  }
} 
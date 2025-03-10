import { NextResponse } from 'next/server';

export async function GET() {
  // Définir les en-têtes du fichier CSV
  const headers = ['name', 'description', 'category', 'cost', 'unit', 'reference', 'sellingPrice'];
  
  // Définir quelques exemples de données
  const exampleData = [
    ['Peinture murale', 'Peinture acrylique mate', 'MATERIAL', '25,50', 'L', '10001', '45,99'],
    ['Main d\'œuvre peinture', 'Application de peinture', 'SERVICE', '35,00', 'h', '20001', '65,00'],
    ['Enduit de lissage', 'Enduit pour murs intérieurs', 'MATERIAL', '12,75', 'kg', '10002', '22,50'],
    ['Pose de papier peint', 'Installation papier peint', 'SERVICE', '40,00', 'h', '20002', '75,00']
  ];

  // Créer le contenu du fichier CSV
  const csvContent = [
    headers.join(','),
    ...exampleData.map(row => row.join(','))
  ].join('\n');

  // Créer la réponse avec les bons en-têtes pour le téléchargement
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=modele_import_produits.csv'
    }
  });
} 
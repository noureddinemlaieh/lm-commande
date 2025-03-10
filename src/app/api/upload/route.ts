import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    console.log('Fichier reçu:', file.name, file.type, file.size);
    
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Seules les images sont acceptées.' },
        { status: 400 }
      );
    }
    
    // Limiter la taille du fichier (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux. Taille maximale: 5MB' },
        { status: 400 }
      );
    }
    
    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Créer le chemin du dossier public/uploads
    const publicPath = join(process.cwd(), 'public', 'uploads');
    const filePath = join(publicPath, fileName);
    
    // Convertir le fichier en tableau d'octets
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Écrire le fichier sur le disque
    await writeFile(filePath, buffer);
    
    // Retourner l'URL du fichier
    const fileUrl = `/uploads/${fileName}`;
    console.log('Fichier enregistré:', fileUrl);
    
    return NextResponse.json({ 
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du téléchargement du fichier',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 
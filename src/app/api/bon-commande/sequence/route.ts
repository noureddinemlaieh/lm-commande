import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Ajouter un cache pour éviter de requêter la base de données à chaque fois
let cachedSettings: Record<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

export async function GET() {
  try {
    const now = new Date();
    const currentTime = now.getTime();
    
    // Vérifier si nous avons des paramètres en cache et si le cache est encore valide
    if (!cachedSettings || (currentTime - cacheTimestamp) > CACHE_DURATION) {
      // Récupérer tous les paramètres de numérotation
      const settings = await prisma.$queryRaw<Array<any>>`
        SELECT * FROM "Settings" 
        WHERE category = 'NUMEROTATION' 
        AND key IN ('bon_commande_prefix', 'bon_commande_digits', 'bon_commande_counter', 'bon_commande_format', 'bon_commande_reset_period')
      `;

      // Convertir en objet pour un accès facile
      cachedSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      // Mettre à jour le timestamp du cache
      cacheTimestamp = currentTime;
    }

    // Utiliser les paramètres du cache
    const params = cachedSettings || {};

    // Valeurs par défaut si les paramètres n'existent pas
    const prefix = params['bon_commande_prefix'] || 'BC';  // Préfixe par défaut
    const digits = parseInt(params['bon_commande_digits'] || '4', 10);
    const counter = parseInt(params['bon_commande_counter'] || '1', 10);
    // Format par défaut
    const format = params['bon_commande_format'] || '{PREFIX}{COUNTER}';
    
    // Formater le compteur avec des zéros devant
    const paddedCounter = String(counter).padStart(digits, '0');

    // Générer le numéro selon le format configuré
    const reference = format
      .replace('{PREFIX}', prefix)
      .replace('{COUNTER}', paddedCounter);

    // Incrémenter le compteur
    await prisma.$executeRaw`
      UPDATE "Settings" 
      SET value = ${String(counter + 1)}, "updatedAt" = NOW()
      WHERE key = 'bon_commande_counter'
    `;
    
    // Mettre à jour le compteur dans le cache
    if (cachedSettings) {
      cachedSettings['bon_commande_counter'] = String(counter + 1);
    }

    // Essayer d'enregistrer dans l'historique en arrière-plan
    try {
      // Utiliser une promesse non attendue pour ne pas bloquer la réponse
      prisma.$executeRaw`
        INSERT INTO "NumberingHistory" (id, type, number, "createdAt", "updatedAt", "userId")
        VALUES (${randomUUID()}, 'bon_commande', ${reference}, NOW(), NOW(), NULL)
      `.catch(historyError => {
        console.warn('Impossible d\'enregistrer dans l\'historique:', historyError);
      });
    } catch (historyError) {
      console.warn('Impossible d\'enregistrer dans l\'historique:', historyError);
      // Continuer même si l'enregistrement dans l'historique échoue
    }

    return NextResponse.json({ reference });
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de bon de commande:', error);
    return NextResponse.json({ 
      reference: `ERROR-${Date.now()}`
    });
  }
} 
import { prisma } from './prisma';

type DocumentType = 'devis' | 'facture' | 'bon_commande';

export async function generateNumber(type: DocumentType): Promise<string> {
  try {
    // Utiliser une transaction pour éviter les problèmes de concurrence
    return await prisma.$transaction(async (tx) => {
      // Récupérer les paramètres de numérotation
      const settings = await tx.settings.findMany({
        where: {
          category: 'NUMEROTATION',
          key: {
            in: [
              `${type}_prefix`,
              `${type}_digits`,
              `${type}_counter`,
              `${type}_format`
            ]
          }
        }
      });

      // Convertir en objet pour un accès facile
      const params = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      // Valeurs par défaut si les paramètres n'existent pas
      const prefix = params[`${type}_prefix`] || '';
      const digits = parseInt(params[`${type}_digits`] || '4', 10);
      const counter = parseInt(params[`${type}_counter`] || '1', 10);
      const format = params[`${type}_format`] || '{PREFIX}{COUNTER}';

      // Formater le compteur avec des zéros devant
      const paddedCounter = String(counter).padStart(digits, '0');

      // Générer le numéro selon le format
      const number = format
        .replace('{PREFIX}', prefix)
        .replace('{COUNTER}', paddedCounter);

      // Incrémenter le compteur dans la transaction
      await tx.settings.upsert({
        where: { key: `${type}_counter` },
        update: { value: String(counter + 1) },
        create: {
          key: `${type}_counter`,
          value: String(counter + 1),
          category: 'NUMEROTATION'
        }
      });

      return number;
    });
  } catch (error) {
    console.error(`Error generating ${type} number:`, error);
    // Retourner un numéro par défaut en cas d'erreur
    return `ERROR-${Date.now()}`;
  }
}

// Fonction pour réinitialiser un compteur
export async function resetCounter(type: DocumentType, value: number = 1): Promise<boolean> {
  try {
    await prisma.settings.upsert({
      where: { key: `${type}_counter` },
      update: { value: String(value) },
      create: {
        key: `${type}_counter`,
        value: String(value),
        category: 'NUMEROTATION'
      }
    });
    return true;
  } catch (error) {
    console.error(`Error resetting ${type} counter:`, error);
    return false;
  }
} 
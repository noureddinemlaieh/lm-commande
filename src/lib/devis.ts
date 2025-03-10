import prisma from '@/lib/prisma';
import { cache } from 'react';

/**
 * Génère un numéro de devis basé sur l'année et le compteur
 * @deprecated Cette fonction est dépréciée. Utilisez l'API /api/devis/sequence à la place.
 */
export function generateDevisNumber(year: number, number: number): string {
  console.warn('La fonction generateDevisNumber est dépréciée. Utilisez l\'API /api/devis/sequence à la place.');
  return `DEVIS-${year}-${String(number).padStart(4, '0')}`;
}

/**
 * Récupère un devis par son ID avec toutes ses relations
 * Cette fonction est mise en cache pour éviter des requêtes répétées
 */
export const getDevisById = cache(async (id: string) => {
  if (!id) return null;
  
  try {
    return await prisma.devis.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            services: {
              orderBy: { order: 'asc' },
              include: {
                materials: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        client: true,
        prescriber: true,
        catalog: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error);
    return null;
  }
});

/**
 * Récupère les devis avec pagination et filtres
 */
export async function getDevisList({
  status,
  year,
  clientId,
  page = 1,
  limit = 10,
  search,
  includeRelations = false,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}: {
  status?: string;
  year?: number;
  clientId?: string;
  page?: number;
  limit?: number;
  search?: string;
  includeRelations?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  try {
    // Valider les paramètres de pagination
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;
    const skip = (validPage - 1) * validLimit;
    
    // Construire les filtres
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (year) {
      where.year = year;
    }
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Compter le nombre total de devis pour la pagination
    const totalCount = await prisma.devis.count({ where });
    
    // Définir les relations à inclure
    const include: any = {
      client: true
    };
    
    if (includeRelations) {
      include.sections = {
        include: {
          services: {
            include: {
              materials: true
            }
          }
        }
      };
      include.prescriber = true;
      include.catalog = true;
    }
    
    // Récupérer les devis avec pagination
    const devis = await prisma.devis.findMany({
      where,
      include,
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: validLimit
    });
    
    // Retourner les résultats avec les métadonnées de pagination
    return {
      data: devis,
      pagination: {
        total: totalCount,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(totalCount / validLimit)
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des devis:', error);
    throw new Error('Erreur lors de la récupération des devis');
  }
}

/**
 * Récupère les statistiques des devis (comptage par statut, par année, etc.)
 * Cette fonction est mise en cache pour améliorer les performances
 */
export const getDevisStats = cache(async () => {
  try {
    // Compter les devis par statut
    const statusStats = await prisma.devis.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    // Compter les devis par année
    const yearStats = await prisma.devis.groupBy({
      by: ['year'],
      _count: {
        id: true
      },
      orderBy: {
        year: 'desc'
      }
    });
    
    // Calculer le montant total des devis par statut
    const totalAmountByStatus = await prisma.$queryRaw`
      SELECT d.status, SUM(ds.subTotal) as total
      FROM "Devis" d
      JOIN "DevisSection" ds ON d.id = ds."devisId"
      GROUP BY d.status
    `;
    
    return {
      byStatus: statusStats,
      byYear: yearStats,
      totalAmount: totalAmountByStatus
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      byStatus: [],
      byYear: [],
      totalAmount: []
    };
  }
}); 
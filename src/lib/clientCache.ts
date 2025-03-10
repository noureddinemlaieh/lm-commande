/**
 * Utilitaire de mise en cache côté client pour stocker les données qui ne changent pas fréquemment
 */

// Durée de validité du cache par défaut (en millisecondes)
const DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Interface pour les entrées du cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Enregistre des données dans le cache local
 * @param key Clé unique pour identifier les données
 * @param data Données à mettre en cache
 * @param duration Durée de validité du cache en millisecondes (24h par défaut)
 */
export function setCache<T>(key: string, data: T, duration: number = DEFAULT_CACHE_DURATION): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + duration
    };
    
    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch (error) {
    console.warn('Erreur lors de la mise en cache des données:', error);
  }
}

/**
 * Récupère des données du cache local
 * @param key Clé unique pour identifier les données
 * @returns Les données mises en cache ou null si le cache est expiré ou inexistant
 */
export function getCache<T>(key: string): T | null {
  try {
    const cachedData = localStorage.getItem(`cache_${key}`);
    
    if (!cachedData) {
      return null;
    }
    
    const entry: CacheEntry<T> = JSON.parse(cachedData);
    
    // Vérifier si le cache est expiré
    if (Date.now() > entry.expiry) {
      // Supprimer le cache expiré
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('Erreur lors de la récupération des données du cache:', error);
    return null;
  }
}

/**
 * Supprime une entrée spécifique du cache
 * @param key Clé de l'entrée à supprimer
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.warn('Erreur lors de la suppression du cache:', error);
  }
}

/**
 * Supprime toutes les entrées du cache
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression de tout le cache:', error);
  }
}

/**
 * Vérifie si une entrée du cache existe et est valide
 * @param key Clé de l'entrée à vérifier
 * @returns true si l'entrée existe et est valide, false sinon
 */
export function hasCacheValid(key: string): boolean {
  try {
    const cachedData = localStorage.getItem(`cache_${key}`);
    
    if (!cachedData) {
      return false;
    }
    
    const entry = JSON.parse(cachedData);
    
    return Date.now() <= entry.expiry;
  } catch (error) {
    console.warn('Erreur lors de la vérification du cache:', error);
    return false;
  }
} 
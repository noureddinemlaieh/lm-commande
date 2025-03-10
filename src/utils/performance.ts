/**
 * Utilitaires pour améliorer les performances de l'application
 */

/**
 * Débounce une fonction pour limiter son exécution
 * @param func - Fonction à débouncer
 * @param wait - Temps d'attente en ms
 * @returns Fonction debouncée
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle une fonction pour limiter sa fréquence d'exécution
 * @param func - Fonction à throttler
 * @param limit - Limite de temps en ms
 * @returns Fonction throttlée
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Mesure le temps d'exécution d'une fonction
 * @param func - Fonction à mesurer
 * @param name - Nom de la fonction pour le log
 * @returns Fonction avec mesure de performance
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  name: string = 'Function'
): (...args: Parameters<T>) => ReturnType<T> {
  return function(...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start}ms to execute`);
    
    return result;
  };
}

/**
 * Cache les résultats d'une fonction pour éviter les calculs répétés
 * @param func - Fonction à mettre en cache
 * @returns Fonction avec mise en cache
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  };
} 
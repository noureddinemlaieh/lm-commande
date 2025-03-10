import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce, throttle } from './performance';

/**
 * Hook personnalisé pour créer une référence stable à une fonction
 * @param callback - Fonction à stabiliser
 * @returns Référence stable à la fonction
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Hook personnalisé pour créer une version debounced d'une fonction
 * @param callback - Fonction à debouncer
 * @param delay - Délai en ms
 * @returns Fonction debouncée
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const stableCallback = useStableCallback(callback);
  const debouncedCallback = useRef(debounce(stableCallback, delay));
  
  useEffect(() => {
    debouncedCallback.current = debounce(stableCallback, delay);
  }, [stableCallback, delay]);
  
  return debouncedCallback.current as T;
}

/**
 * Hook personnalisé pour créer une version throttled d'une fonction
 * @param callback - Fonction à throttler
 * @param limit - Limite en ms
 * @returns Fonction throttlée
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const stableCallback = useStableCallback(callback);
  const throttledCallback = useRef(throttle(stableCallback, limit));
  
  useEffect(() => {
    throttledCallback.current = throttle(stableCallback, limit);
  }, [stableCallback, limit]);
  
  return throttledCallback.current as T;
}

/**
 * Hook personnalisé pour créer une valeur debouncée
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms
 * @returns Valeur debouncée
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook personnalisé pour éviter les rendus inutiles
 * @param value - Valeur à comparer
 * @param isEqual - Fonction de comparaison
 * @returns Valeur mémorisée
 */
export function useDeepCompareMemoize<T>(value: T, isEqual: (a: T, b: T) => boolean = Object.is): T {
  const ref = useRef<T>(value);
  
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Hook personnalisé pour mesurer les performances de rendu
 * @param componentName - Nom du composant
 */
export function useRenderPerformance(componentName: string): void {
  const renderCount = useRef(0);
  const lastRender = useRef(performance.now());
  
  useEffect(() => {
    const now = performance.now();
    const timeSinceLastRender = now - lastRender.current;
    renderCount.current += 1;
    
    console.log(
      `[Performance] ${componentName} rendu #${renderCount.current} (${timeSinceLastRender.toFixed(2)}ms depuis le dernier rendu)`
    );
    
    lastRender.current = now;
  });
} 
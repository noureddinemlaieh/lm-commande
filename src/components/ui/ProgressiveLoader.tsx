import React, { useEffect, useState } from 'react';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDisplayTime?: number;
  delay?: number;
}

/**
 * Composant de chargement progressif qui affiche un fallback pendant le chargement initial
 * et garantit un temps minimum d'affichage pour éviter les flashs
 */
export default function ProgressiveLoader({
  children,
  fallback = React.createElement("div", { className: "loading-spinner" }, "Chargement..."),
  minDisplayTime = 500,
  delay = 0
}: ProgressiveLoaderProps) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Temps de début du chargement
    const startTime = Date.now();
    
    // Délai initial avant de commencer à charger
    const delayTimer = setTimeout(() => {
      // Calculer le temps restant pour atteindre le temps minimum d'affichage
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      // Attendre le temps restant avant d'afficher le contenu
      const displayTimer = setTimeout(() => {
        setIsReady(true);
      }, remainingTime);
      
      return () => clearTimeout(displayTimer);
    }, delay);
    
    return () => clearTimeout(delayTimer);
  }, [minDisplayTime, delay]);
  
  return isReady ? React.createElement(React.Fragment, null, children) : React.createElement(React.Fragment, null, fallback);
}

/**
 * Hook pour précharger des ressources (images, scripts, etc.)
 * @param resources - Liste des URLs à précharger
 * @param type - Type de ressource ('image' ou 'script')
 * @returns État de chargement
 */
export function usePreloadResources(
  resources: string[],
  type: 'image' | 'script' = 'image'
): { isLoaded: boolean; progress: number } {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const newLoaded: Record<string, boolean> = {};
    resources.forEach(url => {
      newLoaded[url] = false;
    });
    setLoaded(newLoaded);
    
    resources.forEach(url => {
      if (type === 'image') {
        const img = new Image();
        img.onload = () => {
          setLoaded(prev => ({ ...prev, [url]: true }));
        };
        img.onerror = () => {
          setLoaded(prev => ({ ...prev, [url]: true })); // Considérer comme chargé même en cas d'erreur
        };
        img.src = url;
      } else if (type === 'script') {
        const script = document.createElement('script');
        script.onload = () => {
          setLoaded(prev => ({ ...prev, [url]: true }));
        };
        script.onerror = () => {
          setLoaded(prev => ({ ...prev, [url]: true })); // Considérer comme chargé même en cas d'erreur
        };
        script.src = url;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }, [resources, type]);
  
  const loadedCount = Object.values(loaded).filter(Boolean).length;
  const progress = resources.length > 0 ? (loadedCount / resources.length) * 100 : 100;
  const isLoaded = loadedCount === resources.length;
  
  return { isLoaded, progress };
} 
import React from 'react';
import dynamic from 'next/dynamic';

// Fonction pour charger dynamiquement les composants avec options
export const dynamicComponent = (importFunc: () => Promise<any>, options = {}) => {
  return dynamic(importFunc, {
    ssr: false, // Désactiver le rendu côté serveur pour les composants lourds
    loading: () => React.createElement('div', { className: 'loading-component' }, 'Chargement...'),
    ...options,
  });
};

// Précharger les composants fréquemment utilisés
export const preloadComponent = (importFunc: () => Promise<any>) => {
  // Cette fonction peut être appelée dans les pages pour précharger les composants
  // avant qu'ils ne soient nécessaires
  importFunc();
}; 
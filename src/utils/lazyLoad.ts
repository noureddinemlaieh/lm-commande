import dynamic from 'next/dynamic';
import React, { ComponentType, ReactNode } from 'react';

interface LazyLoadOptions {
  ssr?: boolean;
  loading?: () => ReactNode;
}

/**
 * Fonction utilitaire pour charger paresseusement les composants
 * @param importFunc - Fonction d'importation du composant
 * @param options - Options de chargement
 * @returns Composant chargé paresseusement
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    ssr = false,
    loading = () => React.createElement("div", { className: "lazy-loading" }, "Chargement...")
  } = options;

  return dynamic(importFunc, {
    ssr,
    loading
  });
}

/**
 * Précharge un composant pour améliorer les performances
 * @param importFunc - Fonction d'importation du composant
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  importFunc();
} 
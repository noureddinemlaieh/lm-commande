import React, { ComponentType } from 'react';
import dynamic from 'next/dynamic';

interface DynamicOptions {
  ssr?: boolean;
  loading?: ComponentType;
}

/**
 * Charge dynamiquement un composant avec des options
 * @param importFunc - Fonction d'import du composant
 * @param options - Options de chargement dynamique
 * @returns Composant chargé dynamiquement
 */
export function dynamicComponent<Props>(
  importFunc: () => Promise<{ default: ComponentType<Props> }>,
  options: DynamicOptions = {}
) {
  return dynamic(importFunc, {
    ssr: options.ssr ?? false,
    loading: options.loading,
  });
}

/**
 * Précharge un composant fréquemment utilisé
 * @param importFunc - Fonction d'import du composant
 */
export function preloadComponent<Props>(
  importFunc: () => Promise<{ default: ComponentType<Props> }>
) {
  const component = importFunc();
  return component;
} 
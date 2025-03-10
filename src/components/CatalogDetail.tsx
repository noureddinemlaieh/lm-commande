"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { App, message } from 'antd';
import { Product } from '@/types/Product';

// Interface pour les props du composant
interface CatalogDetailProps {
  onProductUpdate?: (product: Product) => void;
}

// Déplacer les fonctions utilitaires en dehors du composant
const handleDeleteService = async (serviceId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/services/${serviceId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression du service');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    throw error;
  }
};

const handleCreateService = async (serviceData: Record<string, unknown>): Promise<Record<string, unknown>> => {
  try {
    const response = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création du service');
    }
    
    const newService = await response.json();
    return newService;
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    throw error;
  }
};

const handleUpdateProduct = async (product: Product): Promise<Product> => {
  try {
    const response = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du produit');
    }
    
    const updatedProduct = await response.json();
    return updatedProduct;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    throw error;
  }
};

// Créer un composant fonctionnel pour utiliser les hooks
const CatalogDetail: React.FC<CatalogDetailProps> = ({ onProductUpdate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const { notification } = App.useApp();

  // Utiliser useCallback pour les fonctions qui sont des dépendances de useEffect
  const handleProductsUpdated = useCallback((event: CustomEvent) => {
    setProducts(event.detail);
    
    // Si une fonction de callback est fournie, l'appeler avec les produits mis à jour
    if (onProductUpdate && event.detail && event.detail.length > 0) {
      onProductUpdate(event.detail[0]);
    }
  }, [onProductUpdate]);

  useEffect(() => {
    // Ajouter l'écouteur d'événement
    window.addEventListener('productsUpdated', handleProductsUpdated as EventListener);
    
    // Nettoyer l'écouteur d'événement lors du démontage du composant
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated as EventListener);
    };
  }, [handleProductsUpdated]);

  return (
    <div className="catalog-detail">
      {/* Contenu du composant */}
      {products.length > 0 ? (
        <div>
          <h2>Produits disponibles: {products.length}</h2>
          <ul>
            {products.map(product => (
              <li key={product.id}>{product.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Aucun produit disponible</p>
      )}
    </div>
  );
};

export default CatalogDetail;
export { handleDeleteService, handleCreateService, handleUpdateProduct }; 
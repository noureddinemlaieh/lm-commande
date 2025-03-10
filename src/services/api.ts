import { Product } from '@/types/Product';

export const getCatalogs = async () => {
  try {
    const response = await fetch('/api/catalogs');
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des catalogues');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API getCatalogs:', error);
    throw error;
  }
};

export const getCatalogCategories = async (catalogId: string) => {
  try {
    console.log(`API: Récupération des catégories pour le catalogue ${catalogId}`);
    
    const response = await fetch(`/api/catalogs/${catalogId}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur lors du chargement des catégories: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API: Catégories récupérées:`, data);
    return data;
  } catch (error) {
    console.error('Erreur API getCatalogCategories:', error);
    throw error;
  }
};

export const getProducts = async () => {
  try {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des produits');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API getProducts:', error);
    throw error;
  }
};

export const createService = async (serviceData: any) => {
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
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API createService:', error);
    throw error;
  }
};

export const createProduct = async (productData: any): Promise<Product> => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création du produit');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API createProduct:', error);
    throw error;
  }
};

export const deleteService = async (serviceId?: string) => {
  if (!serviceId) throw new Error('ID du service non défini');
  
  const response = await fetch(`/api/services/${serviceId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du service');
  }

  return await response.json();
};

export const updateProduct = async (product: Product): Promise<Product> => {
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

    return await response.json();
  } catch (error) {
    console.error('Erreur API updateProduct:', error);
    throw error;
  }
};

export const createCategory = async (categoryData: { name: string; catalogId: string; description?: string }) => {
  try {
    console.log(`API: Création d'une catégorie dans le catalogue ${categoryData.catalogId}:`, categoryData);
    
    const response = await fetch(`/api/catalogs/${categoryData.catalogId}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: categoryData.name,
        description: categoryData.description
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur HTTP ${response.status}: ${errorText}`);
      throw new Error(`Erreur lors de la création de la catégorie: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`API: Catégorie créée:`, data);
    return data;
  } catch (error) {
    console.error('Erreur API createCategory:', error);
    throw error;
  }
}; 
import prisma from '@/lib/prisma';
import { Product, ProductCategory } from '@/types/Product';

export const productService = {
  async createProduct(data: Omit<Product, 'id'>) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du produit');
    }
    
    return response.json();
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du produit');
    }
    
    return response.json();
  },

  async deleteProduct(id: string) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression du produit');
    }
    
    return response.json();
  },

  async getAllProducts() {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des produits');
    }
    
    return response.json();
  },

  async getProductById(id: string): Promise<Product> {
    try {
      const response = await fetch(`/api/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du produit');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur dans getProductById:', error);
      throw error;
    }
  },
}; 
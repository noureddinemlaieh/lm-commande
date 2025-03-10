import React, { useState } from 'react';
import { message } from 'antd';

const CatalogDetail: React.FC = () => {
  const [catalog, setCatalog] = useState([]);

  const fetchCatalog = async () => {
    // Implementation of fetchCatalog function
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression de la catégorie');
      }

      message.success('Catégorie supprimée avec succès');
      fetchCatalog(); // Recharger les données après la suppression
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      message.error(`Erreur lors de la suppression de la catégorie: ${error.message}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du service');
      }

      message.success('Service supprimé avec succès');
      fetchCatalog(); // Recharger les données après la suppression
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      message.error(`Erreur lors de la suppression du service: ${error.message}`);
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default CatalogDetail; 
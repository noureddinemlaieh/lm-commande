import { Catalog, Category, Material } from '../types/Catalog';
import axios from 'axios';

interface ExportedCatalog {
  id: string;
  name: string;
  categories: {
    id: string;
    name: string;
    materials: {
      id: string;
      name: string;
      reference: string;
      price: number;
      quantity: number;
      unit: string;
      dimensions?: string;
    }[];
  }[];
}

export const exportCatalog = async (catalogId: string): Promise<ExportedCatalog> => {
  try {
    // Récupérer les données du catalogue
    const { data: catalog } = await axios.get(`/api/catalogs/${catalogId}`);
    
    // Formater les données pour l'export
    const exportData: ExportedCatalog = {
      id: catalog.id,
      name: catalog.name,
      categories: catalog.categories.map((category: Category) => ({
        id: category.id,
        name: category.name,
        materials: category.materials.map((material: Material) => ({
          id: material.id,
          name: material.name,
          reference: material.reference,
          price: material.price,
          quantity: material.quantity,
          unit: material.unit,
          dimensions: material.dimensions
        }))
      }))
    };
    
    return exportData;
  } catch (error) {
    console.error('Erreur lors de l\'export du catalogue:', error);
    throw new Error('Impossible d\'exporter le catalogue');
  }
};

export const downloadCatalogAsJson = (catalog: ExportedCatalog): void => {
  // Créer un blob avec les données du catalogue
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
  
  // Créer un lien de téléchargement
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `catalogue-${catalog.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  
  // Déclencher le téléchargement
  document.body.appendChild(link);
  link.click();
  
  // Nettoyer
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importCatalog = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error('Erreur de lecture du fichier');
        }
        
        const importedCatalog: ExportedCatalog = JSON.parse(event.target.result);
        
        // Envoyer les données au serveur pour créer un nouveau catalogue
        const { data } = await axios.post('/api/catalogs/import', importedCatalog);
        
        resolve(data.id);
      } catch (error) {
        console.error('Erreur lors de l\'import du catalogue:', error);
        reject(new Error('Le fichier importé n\'est pas un catalogue valide'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur de lecture du fichier'));
    };
    
    reader.readAsText(file);
  });
}; 
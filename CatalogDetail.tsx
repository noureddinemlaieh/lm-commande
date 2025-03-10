"use client";

import { App } from 'antd';
import { useState, useEffect } from 'react';

interface ServiceValues {
  id?: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  quantity?: number;
  unit?: string;
  order?: number;
  materials?: any[];
}

const CatalogDetail = () => {
  const { message } = App.useApp();
  const [services, setServices] = useState<ServiceValues[]>([]);
  const [currentService, setCurrentService] = useState<ServiceValues | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    // Chargez les services initiaux ici
  }, []);

  const handleCreateService = async (values: ServiceValues) => {
    try {
      console.log('Données envoyées:', values);

      // Nettoyez les données avant l'envoi
      const cleanedValues = {
        name: values.name,
        description: values.description || null,
        categoryId: values.categoryId,
        price: parseFloat(values.price.toString().replace('€', '').trim()),
        quantity: values.quantity || 1,
        unit: values.unit || null,
        order: values.order || 0,
        // Ne pas inclure materials pour l'instant
      };

      console.log('Données nettoyées:', cleanedValues);

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur du serveur:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la création du service');
      }

      const newService = await response.json();
      message.success({ content: 'Service créé avec succès!', key: 'createService' });
      setServices([...services, newService]);
      setCurrentService(newService);
      
    } catch (error: any) {
      console.error('Erreur:', error);
      message.error({ 
        content: `Échec de la création du service: ${error.message}`,
        key: 'createService'
      });
    }
  };

  const handleAddMaterial = async (productId: string, quantity: number) => {
    try {
      if (!currentService?.id) {
        throw new Error('Aucun service sélectionné');
      }

      console.log('Ajout de matériau:', { 
        serviceId: currentService.id, 
        productId, 
        quantity 
      });

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: currentService.id,
          productId,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur du serveur:', errorData);
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du matériau');
      }

      const newMaterial = await response.json();
      message.success('Matériau ajouté avec succès!');
      
      // Mettre à jour la liste des matériaux
      setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
      
    } catch (error: any) {
      console.error('Erreur:', error);
      message.error(`Échec de l'ajout du matériau: ${error.message}`);
    }
  };

  const handleEditCategory = async (categoryId: string, updatedData: any) => {
    try {
      // Ajout de logs pour déboguer
      console.log("Données envoyées:", updatedData);
      
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      // Vérification de la réponse
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erreur de réponse:", response.status, errorData);
        throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
      }
      
      const data = await response.json();
      // Mise à jour de l'état local avec les données mises à jour
      // ... votre code existant pour mettre à jour l'état
      
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie:", error);
      // Gérer l'erreur (afficher un message à l'utilisateur, etc.)
      throw error;
    }
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    try {
      const { name, value } = e.target;
      
      // Validation des données avant envoi
      if (name === "someRequiredField" && !value.trim()) {
        console.error("Champ obligatoire manquant");
        return;
      }
      
      const updatedData = {
        // Utiliser un objet vide au lieu de categoryData qui n'est pas défini
        [name]: value,
      };
      
      handleEditCategory(categoryId, updatedData);
    } catch (error) {
      console.error("Erreur dans onChange:", error);
    }
  }

  // ... reste de votre composant, utilisez 'services' pour afficher les prestations
};

export default CatalogDetail; 
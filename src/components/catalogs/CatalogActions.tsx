'use client';

import React, { useState } from 'react';
import { Button, Modal, Upload, message } from 'antd';
import { UploadOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface CatalogActionsProps {
  catalogId?: string;
  isDetailView?: boolean;
}

const CatalogActions: React.FC<CatalogActionsProps> = ({ catalogId, isDetailView = false }) => {
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const router = useRouter();

  const handleExport = async () => {
    if (!catalogId) return;
    
    try {
      // Récupérer les données complètes du catalogue
      const response = await fetch(`/api/catalogs/${catalogId}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du catalogue');
      }
      
      const catalog = await response.json();
      
      // Formater les données pour l'exportation dans un format compatible avec l'importation
      const exportData = {
        name: catalog.name,
        description: catalog.description || '',
        categories: catalog.categories?.map((category: any) => ({
          name: category.name,
          order: category.order || 0,
          services: category.services?.map((service: any) => ({
            name: service.name,
            description: service.description || null,
            price: service.price || 0,
            quantity: service.quantity || 1,
            unit: service.unit || null,
            order: service.order || 0,
            materials: service.materials?.map((material: any) => ({
              name: material.name,
              quantity: material.quantity || 1,
              price: material.price || 0,
              unit: material.unit || 'u',
              reference: material.reference || null,
              toChoose: material.toChoose || false
            })) || []
          })) || []
        })) || []
      };
      
      // Créer un blob avec les données du catalogue
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      
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
      
      message.success('Catalogue exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export du catalogue:', error);
      message.error('Erreur lors de l\'export du catalogue');
    }
  };

  const handleImport = async (file: File) => {
    try {
      console.log('Début de l\'importation du fichier:', file.name);
      
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          if (!event.target || typeof event.target.result !== 'string') {
            console.error('Erreur: event.target.result n\'est pas une chaîne');
            throw new Error('Erreur de lecture du fichier');
          }
          
          console.log('Fichier lu avec succès, longueur:', event.target.result.length);
          
          let importedCatalog;
          try {
            importedCatalog = JSON.parse(event.target.result);
            console.log('Parsing JSON réussi');
          } catch (parseError) {
            console.error('Erreur de parsing JSON:', parseError);
            message.error('Le fichier importé n\'est pas un JSON valide');
            return;
          }
          
          // Validation basique côté client
          if (!importedCatalog || typeof importedCatalog !== 'object') {
            console.error('Validation échouée: le catalogue n\'est pas un objet');
            message.error('Le fichier importé n\'est pas un catalogue valide');
            return;
          }
          
          if (!importedCatalog.name) {
            console.error('Validation échouée: le catalogue n\'a pas de nom');
            message.error('Le catalogue doit avoir un nom');
            return;
          }
          
          console.log('Structure du catalogue à importer:', JSON.stringify({
            name: importedCatalog.name,
            description: importedCatalog.description,
            categoriesCount: importedCatalog.categories?.length || 0
          }));
          
          // Envoyer les données au serveur pour créer un nouveau catalogue
          console.log('Envoi des données au serveur');
          const response = await fetch('/api/catalogs/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(importedCatalog),
          });
          
          console.log('Réponse du serveur reçue, status:', response.status);
          const data = await response.json();
          console.log('Données de réponse:', data);
          
          if (!response.ok) {
            console.error('Erreur de réponse:', data);
            throw new Error(data.error || 'Erreur lors de l\'import du catalogue');
          }
          
          message.success('Catalogue importé avec succès');
          setIsImportModalVisible(false);
          router.push(`/catalog/${data.id}`);
        } catch (error) {
          console.error('Erreur détaillée:', error);
          message.error(error instanceof Error ? error.message : 'Erreur lors de l\'import du catalogue');
        }
      };
      
      reader.onerror = (event) => {
        console.error('Erreur de lecture du fichier:', event);
        message.error('Erreur de lecture du fichier');
      };
      
      console.log('Lecture du fichier en tant que texte');
      reader.readAsText(file);
      
      return false; // Empêcher le comportement par défaut de l'upload
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      message.error('Erreur lors de l\'import du catalogue');
      return false;
    }
  };

  if (isDetailView) {
    return (
      <Button 
        icon={<ExportOutlined />} 
        onClick={handleExport} 
        type="primary"
      >
        Exporter
      </Button>
    );
  }

  return (
    <>
      <Button 
        icon={<ImportOutlined />} 
        onClick={() => setIsImportModalVisible(true)}
        type="primary"
        style={{ marginLeft: '8px' }}
      >
        Importer
      </Button>

      <Modal
        title="Importer un catalogue"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          name="file"
          accept=".json"
          beforeUpload={(file) => handleImport(file)}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Cliquez ou glissez-déposez un fichier JSON</p>
        </Upload.Dragger>
      </Modal>
    </>
  );
};

export default CatalogActions; 
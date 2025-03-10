'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, message, Spin, Popconfirm } from 'antd';
import { PlusOutlined, FolderOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
import { Catalog } from '@/types/Catalog';
import CatalogForm from '@/components/catalogs/CatalogForm';
import CatalogImporterNew from '@/components/CatalogImporterNew';
import { useRouter } from 'next/navigation';

const CatalogPage = () => {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fonction pour charger les catalogues
  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/catalogs');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catalogues');
      }
      
      const data = await response.json();
      setCatalogs(data);
    } catch (_err) {
      setError("Impossible de charger les catalogues");
    } finally {
      setLoading(false);
    }
  };

  // Charger les catalogues au montage du composant
  useEffect(() => {
    loadCatalogs();
  }, []);

  const handleCreateCatalog = async (values: { name: string; description?: string }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/catalogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du catalogue');
      }

      await loadCatalogs(); // Recharger les catalogues
      setIsModalVisible(false);
      message.success('Catalogue créé avec succès');
    } catch (err) {
      message.error('Erreur lors de la création du catalogue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCatalog = async (catalogId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la navigation vers la page de détail
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/catalogs/${catalogId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Réponse d\'erreur:', data);
        
        // Afficher une modale d'erreur si le catalogue est utilisé par des devis
        if (data.details && data.details.includes('devis')) {
          setErrorMessage(data.details || 'Ce catalogue est utilisé par des devis et ne peut pas être supprimé.');
          setIsErrorModalVisible(true);
        } else {
          throw new Error(data.error || 'Erreur lors de la suppression du catalogue');
        }
        return;
      }

      message.success('Catalogue supprimé avec succès');
      await loadCatalogs(); // Recharger les catalogues
    } catch (error) {
      console.error('Erreur complète:', error);
      
      // Afficher un message d'erreur plus détaillé
      if (error instanceof Error) {
        message.error(`Erreur: ${error.message}`);
      } else {
        message.error('Erreur lors de la suppression du catalogue');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Gérer l'importation réussie d'un catalogue
  const handleImportSuccess = (catalogId: string) => {
    loadCatalogs(); // Recharger les catalogues
    router.push(`/catalog/${catalogId}`); // Rediriger vers la page du catalogue importé
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Catalogues</h1>
        <div className="flex space-x-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Nouveau Catalogue
          </Button>
          <Button
            icon={<ImportOutlined />}
            onClick={() => setIsImportModalVisible(true)}
          >
            Importer un Catalogue
          </Button>
        </div>
      </div>

      {catalogs.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Vous n&apos;avez pas encore de catalogue. Créez-en un pour commencer à ajouter des prestations et des matériaux.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogs.map(catalog => (
            <Card
              key={catalog.id}
              hoverable
              className="cursor-pointer"
              onClick={() => router.push(`/catalog/${catalog.id}`)}
              actions={[
                <Popconfirm
                  key="delete"
                  title="Supprimer ce catalogue ?"
                  description="Cette action est irréversible."
                  onConfirm={(e) => handleDeleteCatalog(catalog.id, e as React.MouseEvent)}
                  okText="Oui"
                  cancelText="Non"
                  okButtonProps={{ danger: true }}
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    loading={isDeleting}
                  >
                    Supprimer
                  </Button>
                </Popconfirm>
              ]}
            >
              <div className="flex items-start">
                <FolderOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <div className="text-lg font-semibold">{catalog.name}</div>
                  <div className="text-gray-500">{catalog.description}</div>
                  <div className="mt-2 text-sm text-gray-400">
                    {catalog.categories.length} catégorie(s)
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="Nouveau Catalogue"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <CatalogForm
          onSubmit={handleCreateCatalog}
          isLoading={isSubmitting}
        />
      </Modal>

      <CatalogImporterNew
        visible={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onSuccess={handleImportSuccess}
      />

      <Modal
        title="Impossible de supprimer le catalogue"
        open={isErrorModalVisible}
        onCancel={() => setIsErrorModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setIsErrorModalVisible(false)}>
            J'ai compris
          </Button>
        ]}
      >
        <p>{errorMessage}</p>
        <p>Veuillez d'abord supprimer ou modifier les devis qui utilisent ce catalogue avant de le supprimer.</p>
      </Modal>
    </div>
  );
};

export default CatalogPage; 
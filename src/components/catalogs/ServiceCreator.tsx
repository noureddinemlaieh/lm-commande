'use client';

import React, { useState, useEffect } from 'react';
import { Button, Select, message, Spin, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Product } from '@/types/Product';
import { getCatalogs, getProducts, getCatalogCategories } from '@/services/api';
import NewServiceModal from './NewServiceModal';
import CategoryCreator from './CategoryCreator';

interface Catalog {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ServiceCreatorProps {
  onServiceCreated: (newService: any) => void;
  catalogId?: string;
  initialServiceName?: string;
}

const ServiceCreator: React.FC<ServiceCreatorProps> = ({
  onServiceCreated,
  catalogId: initialCatalogId,
  initialServiceName = ''
}) => {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<string | undefined>(initialCatalogId);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [isNewServiceModalVisible, setIsNewServiceModalVisible] = useState(false);
  const [isCategoryCreatorVisible, setIsCategoryCreatorVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceName, setServiceName] = useState<string>(initialServiceName);

  // Charger les catalogues au chargement du composant
  useEffect(() => {
    loadCatalogs();
    loadProducts();
  }, []);

  // Charger les catégories lorsqu'un catalogue est sélectionné
  useEffect(() => {
    if (selectedCatalog) {
      loadCategories(selectedCatalog);
    } else {
      setCategories([]);
    }
  }, [selectedCatalog]);

  // Surveiller les changements de selectedCategory
  useEffect(() => {
    if (selectedCategory) {
      console.log(`Catégorie sélectionnée (useEffect): ${selectedCategory}`);
      // Vérifier que la catégorie sélectionnée existe dans la liste des catégories
      const categoryExists = categories.some(cat => cat.id === selectedCategory);
      if (!categoryExists && categories.length > 0) {
        console.log(`La catégorie sélectionnée ${selectedCategory} n'existe pas dans la liste, sélection de la première catégorie`);
        setSelectedCategory(categories[0].id);
      }
    }
  }, [selectedCategory, categories]);

  // Mettre à jour le nom du service lorsque initialServiceName change
  useEffect(() => {
    if (initialServiceName) {
      console.log(`Initialisation du nom du service: "${initialServiceName}"`);
      setServiceName(initialServiceName);
    }
  }, [initialServiceName]);

  // Charger les catalogues
  const loadCatalogs = async () => {
    try {
      setIsLoading(true);
      const response = await getCatalogs();
      
      if (!response || response.length === 0) {
        console.warn('Aucun catalogue disponible');
        message.warning('Aucun catalogue disponible. Veuillez en créer un d\'abord.');
        setCatalogs([]);
        return;
      }
      
      setCatalogs(response);
      
      // Si un catalogId initial est fourni, l'utiliser
      if (initialCatalogId) {
        setSelectedCatalog(initialCatalogId);
      } else if (response.length > 0) {
        // Sinon, sélectionner le premier catalogue par défaut
        setSelectedCatalog(response[0].id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catalogues:', error);
      message.error('Impossible de charger les catalogues. Veuillez réessayer plus tard.');
      setCatalogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les catégories d'un catalogue
  const loadCategories = async (catalogId: string) => {
    try {
      setIsLoading(true);
      
      // Vérifier si l'ID du catalogue est valide
      if (!catalogId) {
        console.warn('ID du catalogue non valide');
        setCategories([]);
        return;
      }
      
      console.log(`Chargement des catégories pour le catalogue ${catalogId}...`);
      
      try {
        const response = await getCatalogCategories(catalogId);
        console.log('Réponse de l\'API pour les catégories:', response);
        
        if (!response || response.length === 0) {
          console.warn('Aucune catégorie disponible pour ce catalogue');
          message.warning('Aucune catégorie disponible pour ce catalogue. Veuillez en créer une d\'abord.');
          setCategories([]);
          return;
        }
        
        console.log(`${response.length} catégories trouvées pour le catalogue ${catalogId}`);
        setCategories(response);
        
        // Sélectionner la première catégorie par défaut
        if (response.length > 0) {
          console.log(`Sélection de la première catégorie: ${response[0].name} (${response[0].id})`);
          setSelectedCategory(response[0].id);
        } else {
          setSelectedCategory(undefined);
        }
      } catch (apiError) {
        console.error('Erreur API lors du chargement des catégories:', apiError);
        message.error('Impossible de charger les catégories. Veuillez réessayer plus tard.');
        setCategories([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      message.error('Impossible de charger les catégories. Veuillez réessayer plus tard.');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les produits (matériaux)
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getProducts();
      
      if (!response) {
        console.warn('Erreur lors du chargement des produits');
        setProducts([]);
        return;
      }
      
      setProducts(response);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      message.error('Impossible de charger les produits. Les matériaux ne seront pas disponibles.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la création d'un nouveau service
  const handleServiceCreated = (newService: any) => {
    setIsNewServiceModalVisible(false);
    onServiceCreated(newService);
  };

  // Mettre à jour un produit
  const handleUpdateProduct = async (product: Product): Promise<Product> => {
    try {
      // Ici, vous pouvez appeler votre API pour mettre à jour le produit
      // Pour l'instant, nous simulons juste une mise à jour réussie
      const updatedProducts = products.map(p => 
        p.id === product.id ? product : p
      );
      
      if (!updatedProducts.some(p => p.id === product.id)) {
        updatedProducts.push(product);
      }
      
      setProducts(updatedProducts);
      return product;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  };

  // Gérer la création d'une nouvelle catégorie
  const handleCategoryCreated = (newCategory: any) => {
    console.log('Nouvelle catégorie créée:', newCategory);
    setIsCategoryCreatorVisible(false);
    
    // Ajouter la nouvelle catégorie à la liste et la sélectionner immédiatement
    setCategories(prevCategories => {
      const updatedCategories = [...prevCategories, newCategory];
      console.log('Liste des catégories mise à jour:', updatedCategories);
      return updatedCategories;
    });
    
    // Sélectionner explicitement la nouvelle catégorie
    console.log(`Sélection de la nouvelle catégorie: ${newCategory.name} (${newCategory.id})`);
    setSelectedCategory(newCategory.id);
    
    // Afficher un message de succès
    message.success(`Catégorie "${newCategory.name}" créée avec succès`);
    
    // Pas besoin de recharger les catégories, car nous avons déjà mis à jour l'état local
    // et sélectionné la nouvelle catégorie
  };

  return (
    <div className="service-creator">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#1890ff' }}>
            Chargement des données en cours...
          </div>
        </div>
      ) : (
        <>
          <div className="catalog-selector" style={{ marginBottom: '16px' }}>
            {catalogs.length === 0 ? (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Empty 
                  description="Aucun catalogue disponible" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <div style={{ marginTop: '8px' }}>
                  <span>Veuillez d'abord créer un catalogue dans la section Catalogues</span>
                </div>
              </div>
            ) : (
              <>
                <Select
                  style={{ width: '100%', marginBottom: '8px' }}
                  placeholder="Sélectionner un catalogue"
                  value={selectedCatalog}
                  onChange={(value) => {
                    console.log(`Catalogue sélectionné manuellement: ${value}`);
                    setSelectedCatalog(value);
                    // Réinitialiser la catégorie sélectionnée
                    setSelectedCategory(undefined);
                    // Indiquer que le chargement est en cours
                    setIsLoading(true);
                  }}
                  options={catalogs.map(catalog => ({
                    value: catalog.id,
                    label: catalog.name
                  }))}
                  disabled={catalogs.length === 0 || isLoading}
                />
                
                {selectedCatalog && categories.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <Empty 
                      description="Aucune catégorie disponible dans ce catalogue" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Button 
                        type="primary" 
                        onClick={() => setIsCategoryCreatorVisible(true)}
                        disabled={isLoading}
                      >
                        Créer une catégorie
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                      style={{ flex: 1 }}
                      placeholder="Sélectionner une catégorie"
                      value={selectedCategory}
                      onChange={(value) => {
                        console.log(`Catégorie sélectionnée manuellement: ${value}`);
                        setSelectedCategory(value);
                      }}
                      options={categories.map(category => ({
                        value: category.id,
                        label: category.name
                      }))}
                      disabled={!selectedCatalog || categories.length === 0 || isLoading}
                      notFoundContent={categories.length === 0 ? "Aucune catégorie disponible" : null}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) => 
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                    <Button 
                      icon={<PlusOutlined />} 
                      onClick={() => setIsCategoryCreatorVisible(true)}
                      disabled={!selectedCatalog || isLoading}
                      title="Créer une nouvelle catégorie"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsNewServiceModalVisible(true)}
            disabled={!selectedCatalog || !selectedCategory || isLoading}
            style={{ width: '100%' }}
          >
            Créer une nouvelle prestation
          </Button>
          
          {(!selectedCatalog || !selectedCategory) && (
            <div style={{ marginTop: '16px', textAlign: 'center', color: '#ff4d4f' }}>
              {!selectedCatalog 
                ? "Veuillez sélectionner un catalogue" 
                : "Veuillez sélectionner une catégorie"}
            </div>
          )}
        </>
      )}
      
      {isNewServiceModalVisible && selectedCatalog && selectedCategory && (
        <NewServiceModal
          visible={isNewServiceModalVisible}
          onCancel={() => setIsNewServiceModalVisible(false)}
          onSuccess={handleServiceCreated}
          categoryId={selectedCategory}
          catalogId={selectedCatalog}
          products={products}
          onUpdateProduct={handleUpdateProduct}
          initialName={serviceName}
        />
      )}
      
      {isCategoryCreatorVisible && selectedCatalog && (
        <CategoryCreator
          visible={isCategoryCreatorVisible}
          onCancel={() => setIsCategoryCreatorVisible(false)}
          onSuccess={handleCategoryCreated}
          catalogId={selectedCatalog}
        />
      )}
    </div>
  );
};

export default ServiceCreator; 
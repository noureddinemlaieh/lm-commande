import React, { useState, useEffect, useRef } from 'react';
import { Modal, Tree, Button, Checkbox, Spin, Empty, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

// Interface pour les matériaux
interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
  tva?: number;
  billable?: boolean;
}

// Interface pour les prestations
export interface Prestation {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  unit?: string;
  materials: Material[];
  categoryName?: string;
}

// Interface pour les catégories
interface Category {
  id: string;
  name: string;
  services: Prestation[];
}

// Interface pour les props du composant
interface PrestationsSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onAdd: (selectedPrestations: Prestation[]) => void;
  catalogId?: string;
  categories?: Category[];
  loading?: boolean;
}

// Fonction pour convertir les catégories et prestations en structure d'arbre pour le composant Tree
const convertToTreeData = (categories: Category[]): DataNode[] => {
  return categories.map(category => ({
    title: category.name,
    key: `category-${category.id}`,
    selectable: false,
    children: (category.services || []).map(service => ({
      title: (
        <span>
          {service.name}
          {service.price ? ` - ${service.price.toFixed(2)} €` : ''}
        </span>
      ),
      key: `service-${service.id}`,
      isLeaf: true,
      prestation: service,
    })),
  }));
};

const PrestationsSelector: React.FC<PrestationsSelectorProps> = ({
  visible,
  onCancel,
  onAdd,
  catalogId,
  categories = [],
  loading = false,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [filteredTreeData, setFilteredTreeData] = useState<DataNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dataLoaded = useRef(false);

  // Charger les données une seule fois lorsque la modale est ouverte
  useEffect(() => {
    if (visible && catalogId && !dataLoaded.current) {
      setIsLoading(true);
      
      fetch(`/api/catalogs/${catalogId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du catalogue');
          }
          return response.json();
        })
        .then(catalog => {
          if (catalog.categories && Array.isArray(catalog.categories)) {
            // Convertir les catégories au format attendu par le composant
            const formattedCategories = catalog.categories.map(category => ({
              id: category.id,
              name: category.name,
              services: (category.services || []).map(service => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price,
                quantity: service.quantity || 1,
                unit: service.unit || 'u',
                materials: (service.materials || []).map(material => ({
                  id: material.id,
                  name: material.name,
                  quantity: material.quantity,
                  price: material.price,
                  unit: material.unit || 'u',
                  reference: material.reference || '',
                  tva: material.tva || 20,
                  billable: material.billable !== false
                }))
              }))
            }));
            
            // Mettre à jour les données de l'arbre
            const data = convertToTreeData(formattedCategories);
            setTreeData(data);
            setFilteredTreeData(data);
            
            // Développer toutes les catégories par défaut
            const categoryKeys = formattedCategories.map(cat => `category-${cat.id}`);
            setExpandedKeys(categoryKeys);
            
            // Marquer les données comme chargées
            dataLoaded.current = true;
          }
        })
        .catch(error => {
          console.error('Erreur lors du chargement du catalogue:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    
    // Réinitialiser les sélections lorsque la modale est fermée
    if (!visible) {
      setSelectedKeys([]);
      setSearchValue('');
      dataLoaded.current = false;
    }
  }, [visible, catalogId]);

  // Filtrer les données de l'arbre en fonction de la recherche
  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (!value.trim()) {
      setFilteredTreeData(treeData);
      return;
    }

    const normalizedValue = value.toLowerCase();
    
    const filtered = treeData.map(categoryNode => {
      // Filtrer les prestations dans chaque catégorie
      const filteredChildren = (categoryNode.children || []).filter(serviceNode => {
        const serviceName = typeof serviceNode.title === 'string' 
          ? serviceNode.title 
          : (serviceNode.title as React.ReactElement).props.children[0];
          
        return serviceName.toLowerCase().includes(normalizedValue);
      });
      
      // Retourner la catégorie avec les prestations filtrées
      return {
        ...categoryNode,
        children: filteredChildren,
      };
    }).filter(categoryNode => (categoryNode.children || []).length > 0);
    
    setFilteredTreeData(filtered);
  };

  // Gérer la sélection des prestations
  const handleSelect = (selectedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    if (Array.isArray(selectedKeysValue)) {
      setSelectedKeys(selectedKeysValue);
    } else {
      setSelectedKeys(selectedKeysValue.checked);
    }
  };

  // Gérer l'ajout des prestations sélectionnées
  const handleAddSelected = () => {
    const selectedPrestations: Prestation[] = [];
    
    selectedKeys.forEach(key => {
      const keyStr = key.toString();
      if (keyStr.startsWith('service-')) {
        // Parcourir toutes les catégories dans les données de l'arbre
        for (const categoryNode of treeData) {
          const categoryName = categoryNode.title as string;
          
          // Parcourir tous les services dans la catégorie
          for (const serviceNode of (categoryNode.children || [])) {
            if (serviceNode.key === keyStr) {
              // Récupérer la prestation à partir des données du nœud
              const serviceData = (serviceNode as any).prestation;
              if (serviceData) {
                // Créer la prestation à partir des données du nœud
                const prestation: Prestation = {
                  id: serviceData.id,
                  name: serviceData.name,
                  description: serviceData.description,
                  price: serviceData.price || 0,
                  quantity: serviceData.quantity || 1,
                  unit: serviceData.unit || 'u',
                  materials: Array.isArray(serviceData.materials) ? serviceData.materials : [],
                  categoryName: categoryName
                };
                
                selectedPrestations.push(prestation);
                break;
              }
            }
          }
        }
      }
    });
    
    // Réinitialiser la recherche et les sélections
    setSearchValue('');
    setSelectedKeys([]);
    
    onAdd(selectedPrestations);
  };

  // Bouton pour forcer le rechargement des données
  const handleReload = () => {
    dataLoaded.current = false;
    setTreeData([]);
    setFilteredTreeData([]);
    setSelectedKeys([]);
    
    if (catalogId) {
      setIsLoading(true);
      
      fetch(`/api/catalogs/${catalogId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du catalogue');
          }
          return response.json();
        })
        .then(catalog => {
          if (catalog.categories && Array.isArray(catalog.categories)) {
            // Convertir les catégories au format attendu par le composant
            const formattedCategories = catalog.categories.map(category => ({
              id: category.id,
              name: category.name,
              services: (category.services || []).map(service => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price,
                quantity: service.quantity || 1,
                unit: service.unit || 'u',
                materials: (service.materials || []).map(material => ({
                  id: material.id,
                  name: material.name,
                  quantity: material.quantity,
                  price: material.price,
                  unit: material.unit || 'u',
                  reference: material.reference || '',
                  tva: material.tva || 20,
                  billable: material.billable !== false
                }))
              }))
            }));
            
            // Mettre à jour les données de l'arbre
            const data = convertToTreeData(formattedCategories);
            setTreeData(data);
            setFilteredTreeData(data);
            
            // Développer toutes les catégories par défaut
            const categoryKeys = formattedCategories.map(cat => `category-${cat.id}`);
            setExpandedKeys(categoryKeys);
            
            // Marquer les données comme chargées
            dataLoaded.current = true;
          }
        })
        .catch(error => {
          console.error('Erreur lors du rechargement du catalogue:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <Modal
      title="Sélection de prestations"
      open={visible}
      onCancel={() => {
        setSearchValue(''); // Réinitialiser la recherche
        onCancel();
      }}
      width={800}
      footer={[
        <Button key="cancel" onClick={() => {
          setSearchValue(''); // Réinitialiser la recherche
          onCancel();
        }}>
          Annuler
        </Button>,
        <Button
          key="add"
          type="primary"
          onClick={handleAddSelected}
          disabled={selectedKeys.length === 0}
        >
          Ajouter ({selectedKeys.length})
        </Button>,
      ]}
    >
      <div className="mb-4">
        <Input
          placeholder="Rechercher une prestation..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
      </div>
      
      <div className="mb-4">
        <Button type="primary" onClick={handleReload}>
          Recharger les données
        </Button>
      </div>
      
      {isLoading || loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" tip="Chargement des prestations..." />
        </div>
      ) : filteredTreeData.length > 0 ? (
        <Tree
          checkable
          onCheck={handleSelect}
          checkedKeys={selectedKeys}
          onExpand={setExpandedKeys}
          expandedKeys={expandedKeys}
          treeData={filteredTreeData}
          height={400}
          className="prestations-tree"
        />
      ) : (
        <Empty description="Aucune prestation trouvée" />
      )}
    </Modal>
  );
};

export default PrestationsSelector; 
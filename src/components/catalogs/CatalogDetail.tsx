'use client';

import React, { useState, useEffect } from 'react';
import { Button, Collapse, List, Modal, Typography, Popconfirm, Tooltip, InputNumber, Checkbox, Badge, App } from 'antd';
import { 
  PlusOutlined, 
  MenuOutlined, 
  PlusCircleOutlined, 
  DeleteOutlined, 
  DeleteFilled, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  CaretRightOutlined,
  SaveOutlined,
  DownOutlined,
  RightOutlined
} from '@ant-design/icons';
import { Catalog, Category, Service, Product } from '@/types/Catalog';
import CategoryForm from './CategoryForm';
import ServiceForm from './ServiceForm';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import type { PopconfirmProps } from 'antd';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import MaterialSelector from '../catalog/MaterialSelector';

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

interface CatalogDetailProps {
  catalog: Catalog;
  products: Product[];
  onUpdate: () => void;
}

interface ReorderResponse {
  success: boolean;
  error?: string;
}

// Interface pour la configuration de la modal de confirmation
interface ConfirmationModalConfig {
  title: string;
  content: React.ReactNode;
  onConfirm: () => void;
  okText: string;
  cancelText?: string;
  okButtonProps?: Record<string, unknown>;
}

// Interface pour un service dans le contexte de réorganisation
interface ServiceOrderItem {
  id: string;
  order: number;
  [key: string]: unknown;
}

// Type pour les valeurs de champs
type FieldValue = string | number | boolean | null;

const CatalogDetail: React.FC<CatalogDetailProps> = ({
  catalog,
  products,
  onUpdate
}) => {
  const { message } = App.useApp();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showReorderButtons, setShowReorderButtons] = useState(false);
  const [_categoryToDelete, _setCategoryToDelete] = useState<Category | null>(null);
  const [_serviceToDelete, _setServiceToDelete] = useState<Service | null>(null);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [_materialToDelete, setMaterialToDelete] = useState<{ 
    id: string; 
    name: string;
    serviceId: string;
  } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    open: boolean;
    title: string;
    content: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    okText: string;
    cancelText: string;
    okButtonProps: Record<string, unknown>;
  } | null>(null);
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
  const [selectedServiceForMaterial, setSelectedServiceForMaterial] = useState<Service | null>(null);

  useEffect(() => {
    const sortedCategories = [...catalog.categories].sort((a, b) => a.order - b.order);
    setCategories(sortedCategories);
    setExpandedCategories([]);
  }, [catalog]);

  const handleCreateCategory = async (values: { name: string; description?: string }) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          catalogId: catalog.id
        }),
      });

      if (response.ok) {
        message.success('Catégorie créée avec succès');
        setIsCategoryModalVisible(false);
        onUpdate();
      } else {
        throw new Error('Erreur lors de la création de la catégorie');
      }
    } catch (error) {
      message.error('Erreur lors de la création de la catégorie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateService = async (values: {
    name: string;
    description?: string;
    price: number;
    quantity: number;
    materials: Array<{ productId: string; quantity: number }>;
    serviceId?: string;
  }) => {
    if (!selectedCategory) {
      message.error('Aucune catégorie sélectionnée');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Récupérer les informations de la catégorie pour obtenir l'ID du catalogue
      const categoryResponse = await fetch(`/api/categories/${selectedCategory.id}`);
      if (!categoryResponse.ok) {
        throw new Error('Erreur lors de la récupération des informations de la catégorie');
      }
      
      const categoryData = await categoryResponse.json();
      const catalogId = categoryData.catalog?.id;
      
      if (!catalogId) {
        throw new Error('ID du catalogue non trouvé pour cette catégorie');
      }
      
      console.log('Création d\'un service dans le catalogue:', catalogId, 'catégorie:', selectedCategory.id);
      console.log('Données du service:', values);
      
      // Préparer les matériaux avec toutes les informations nécessaires
      const preparedMaterials = await Promise.all(
        values.materials
          .filter(material => material.productId) // Filtrer les matériaux sans productId
          .map(async (material) => {
            // Récupérer les informations du produit
            const productResponse = await fetch(`/api/products/${material.productId}`);
            if (!productResponse.ok) {
              console.warn(`Produit non trouvé pour l'ID: ${material.productId}`);
              return null;
            }
            
            const product = await productResponse.json();
            
            return {
              name: product.name,
              quantity: material.quantity || 1,
              price: product.sellingPrice || 0,
              unit: product.unit || '',
              reference: product.reference || '',
              productId: material.productId
            };
          })
      );
      
      // Filtrer les matériaux nuls (produits non trouvés)
      const validMaterials = preparedMaterials.filter(Boolean);
      
      console.log('Matériaux préparés:', validMaterials);
      console.log(`Envoi de ${validMaterials.length} matériaux sur ${values.materials.length} fournis`);
      
      // Appeler l'API spécifique au catalogue et à la catégorie
      const response = await fetch(`/api/catalogs/${catalogId}/categories/${selectedCategory.id}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          materials: validMaterials,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Service créé avec succès:', result);
        console.log(`Le service contient ${result.materials?.length || 0} matériaux`);
        
        message.success(`Prestation créée avec succès avec ${result.materials?.length || 0} matériaux`);
        setIsServiceModalVisible(false);
        setSelectedCategory(null);
        onUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(`Erreur lors de la création de la prestation: ${errorData.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      message.error('Erreur lors de la création de la prestation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (category: Category, newName: string) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          description: category.description,
        }),
      });

      if (response.ok) {
        message.success('Catégorie mise à jour avec succès');
        onUpdate();
      } else {
        throw new Error('Erreur lors de la mise à jour de la catégorie');
      }
    } catch (error) {
      message.error('Erreur lors de la mise à jour de la catégorie');
      console.error(error);
    }
  };

  const handleMoveCategory = async (currentIndex: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }

    const newCategories = [...categories];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const [movedCategory] = newCategories.splice(currentIndex, 1);
    newCategories.splice(newIndex, 0, movedCategory);

    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      order: index
    }));

    setCategories(updatedCategories);

    try {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: updatedCategories.map((cat, index) => ({
            id: cat.id,
            order: index
          }))
        }),
      });

      const data: ReorderResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réorganisation');
      }
      
      message.success('Ordre mis à jour avec succès');
      onUpdate();
    } catch (error) {
      console.error('Erreur de réorganisation:', error);
      message.error('Erreur lors de la réorganisation des catégories');
      setCategories([...catalog.categories].sort((a, b) => a.order - b.order));
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Prestation supprimée avec succès');
        onUpdate();
      } else {
        throw new Error('Erreur lors de la suppression de la prestation');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      message.error('Erreur lors de la suppression de la prestation');
    }
  };

  const handleDeleteServiceClick = (service: Service, e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmationModal({
      title: "Confirmation de suppression",
      content: <p>Êtes-vous sûr de vouloir supprimer cette prestation ?</p>,
      onConfirm: async () => {
        await handleDeleteService(service.id);
        setConfirmationModal(null);
      },
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
    });
  };

  const handleDeleteCategoryClick = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    openConfirmationModal({
      title: "Confirmation de suppression",
      content: (
        <div>
          <p>Êtes-vous sûr de vouloir supprimer cette catégorie ?</p>
          <p className="text-red-500">Cette action supprimera également toutes les prestations associées.</p>
        </div>
      ),
      onConfirm: async () => {
        await handleDeleteCategory(category.id);
        setConfirmationModal(null);
      },
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
    });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Catégorie supprimée avec succès');
        onUpdate();
      } else {
        throw new Error('Erreur lors de la suppression de la catégorie');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      message.error('Erreur lors de la suppression de la catégorie');
    }
  };

  const toggleServiceExpand = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleServiceFieldUpdate = async (service: Service, field: string, value: FieldValue) => {
    try {
      let endpoint = `/api/services/${service.id}`;
      let updatedService = { ...service, [field]: value };

      if (['unit', 'cost'].includes(field) && service.product) {
        endpoint = `/api/products/${service.product.id}`;
        updatedService = {
          ...service,
          product: {
            ...service.product,
            [field === 'unit' ? 'unit' : 'buyingPrice']: value
          }
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedService),
      });

      if (response.ok) {
        message.success('Mise à jour effectuée avec succès');
        onUpdate();
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      message.error('Erreur lors de la mise à jour de la prestation');
    }
  };

  const handleMaterialFieldUpdate = async (materialId: string, field: string, value: FieldValue) => {
    try {
      // Log pour déboguer
      console.log('Tentative de mise à jour:', {
        materialId,
        field,
        value
      });

      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        }),
      });

      // Log de la réponse
      console.log('Statut de la réponse:', response.status);
      const responseData = await response.text();
      console.log('Données de réponse:', responseData);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${responseData}`);
      }

      message.success('Matériau mis à jour avec succès');
      onUpdate();
    } catch (error) {
      console.error('Erreur détaillée:', error);
      message.error('Erreur lors de la mise à jour du matériau');
    }
  };

  const handleDeleteMaterial = async (materialId: string, serviceId: string) => {
    try {
      // Assurons-nous que l'ID est bien formaté
      const encodedMaterialId = encodeURIComponent(materialId.trim());
      
      // Ajoutons des logs pour déboguer
      console.log('Trying to delete material with ID:', encodedMaterialId);
      
      const response = await fetch(`/api/materials/${encodedMaterialId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Essayons de lire le corps de la réponse pour plus de détails
        const text = await response.text();
        console.error('Response body:', text);
        
        if (response.status === 404) {
          throw new Error('Matériau non trouvé');
        }
        throw new Error(`Erreur lors de la suppression du matériau (${response.status})`);
      }

      message.success('Matériau supprimé avec succès');
      onUpdate();
      setMaterialToDelete(null);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la suppression du matériau');
    }
  };

  const handleDeleteMaterialClick = (material: {
    id: string;
    name: string;
  }, serviceId: string) => {
    openConfirmationModal({
      title: "Confirmation de suppression",
      content: <p>Êtes-vous sûr de vouloir supprimer le matériau &quot;{material.name}&quot; ?</p>,
      onConfirm: async () => {
        await handleDeleteMaterial(material.id, serviceId);
        setConfirmationModal(null);
      },
      okText: "Supprimer",
      cancelText: "Annuler",
      okButtonProps: { danger: true },
    });
  };

  const handleSaveCatalog = async () => {
    try {
      const response = await fetch(`/api/catalogs/${catalog.id}/save`, {
        method: 'POST',
      });

      if (response.ok) {
        message.success('Catalogue sauvegardé avec succès');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      message.error('Erreur lors de la sauvegarde du catalogue');
    }
  };

  const openConfirmationModal = (config: ConfirmationModalConfig) => {
    setConfirmationModal({
      ...config,
      open: true,
      onCancel: () => setConfirmationModal(null),
    });
  };

  const handleServiceReorder = async (categoryId: string, services: ServiceOrderItem[]) => {
    try {
      console.log(`Réorganisation des services pour la catégorie ${categoryId}`);
      console.log('Services à réorganiser:', services);
      
      const response = await fetch(`/api/categories/${categoryId}/reorder-services`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ services }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de réponse:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la réorganisation des services');
      }
      
      const updatedCategory = await response.json();
      console.log('Catégorie mise à jour:', updatedCategory);
      
      message.success('Services réorganisés avec succès');
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de la réorganisation des services:', error);
      message.error('Erreur lors de la réorganisation des services');
    }
  };

  const handleAddMaterial = async (material: Product) => {
    if (!selectedServiceForMaterial) return;
    
    try {
      const response = await fetch(`/api/catalogs/${catalog.id}/prestations/${selectedServiceForMaterial.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId: material.id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        message.success('Matériau ajouté avec succès');
        setIsMaterialModalVisible(false);
        onUpdate();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout du matériau');
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de l\'ajout du matériau');
    }
  };

  const handleAddCategory = async (categoryData: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/catalogs/${catalog.id}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de la catégorie');
      }
      
      message.success('Catégorie ajoutée avec succès');
      
      // Appeler onUpdate pour rafraîchir les données
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      message.error('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Si pas de destination ou si la destination est la même que la source, ne rien faire
    if (!destination) return;
    
    // Si on déplace dans la même catégorie
    if (source.droppableId === destination.droppableId) {
      const categoryId = source.droppableId;
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;

      const reorderedServices = Array.from(category.services);
      const [removed] = reorderedServices.splice(source.index, 1);
      reorderedServices.splice(destination.index, 0, removed);

      setCategories(prev => prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, services: reorderedServices } 
          : cat
      ));

      handleServiceReorder(categoryId, reorderedServices);
    } 
    // Si on déplace vers une autre catégorie
    else {
      const sourceCategory = categories.find(cat => cat.id === source.droppableId);
      const destCategory = categories.find(cat => cat.id === destination.droppableId);
      
      if (!sourceCategory || !destCategory) return;
      
      // Récupérer le service à déplacer
      const serviceToMove = sourceCategory.services[source.index];
      
      // Mettre à jour l'état local
      const newCategories = categories.map(cat => {
        if (cat.id === source.droppableId) {
          // Retirer le service de la catégorie source
          return {
            ...cat,
            services: cat.services.filter(s => s.id !== serviceToMove.id)
          };
        }
        if (cat.id === destination.droppableId) {
          // Ajouter le service à la catégorie destination
          const newServices = Array.from(cat.services);
          newServices.splice(destination.index, 0, serviceToMove);
          return {
            ...cat,
            services: newServices
          };
        }
        return cat;
      });
      
      setCategories(newCategories);
      
      // Appeler l'API pour mettre à jour la catégorie du service
      try {
        const response = await fetch('/api/services/move', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serviceId: serviceToMove.id,
            targetCategoryId: destination.droppableId
          }),
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du déplacement de la prestation');
        }
        
        message.success('Prestation déplacée avec succès');
      } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        message.error('Erreur lors du déplacement de la prestation');
        // Restaurer l'état précédent en cas d'erreur
        setCategories([...catalog.categories].sort((a, b) => a.order - b.order));
      }
    }
  };

  const handleExpandAllCategories = () => {
    setExpandedCategories(categories.map(cat => cat.id));
  };
  
  const handleCollapseAllCategories = () => {
    setExpandedCategories([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <Tooltip title="Ajouter une nouvelle catégorie">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCategoryModalVisible(true)}
            >
              Nouvelle Catégorie
            </Button>
          </Tooltip>
          <Tooltip title={showReorderButtons ? "Masquer la réorganisation" : "Réorganiser les catégories"}>
            <Button
              type={showReorderButtons ? "primary" : "default"}
              icon={<MenuOutlined />}
              onClick={() => setShowReorderButtons(!showReorderButtons)}
            >
              Réorganiser
            </Button>
          </Tooltip>
          <Tooltip title="Sauvegarder le catalogue">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveCatalog}
            >
              Sauvegarder
            </Button>
          </Tooltip>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExpandAllCategories}>Tout déplier</Button>
          <Button onClick={handleCollapseAllCategories}>Tout replier</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={category.id} className="mb-2 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 flex justify-between items-center h-10 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExpandedCategories(
                        expandedCategories.includes(category.id)
                          ? expandedCategories.filter(id => id !== category.id)
                          : [...expandedCategories, category.id]
                      );
                    }}
                    className="text-gray-500 hover:text-blue-500 flex items-center justify-center w-5 h-5"
                  >
                    {expandedCategories.includes(category.id) ? <DownOutlined /> : <RightOutlined />}
                  </button>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <span className="font-medium leading-none">{category.name}</span>
                      <span 
                        className="text-blue-500 ml-2 cursor-pointer"
                        onClick={() => {
                          const newName = prompt("Modifier le nom de la catégorie", category.name);
                          if (newName && newName.trim() !== "") {
                            handleEditCategory(category, newName.trim());
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </span>
                    </div>
                    <Badge 
                      count={category.services.length} 
                      style={{ backgroundColor: '#52c41a', marginLeft: '10px' }}
                      overflowCount={99}
                      size="small"
                    />
                    {category.description && (
                      <Text className="text-gray-500 ml-2 text-sm leading-none">{category.description}</Text>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {showReorderButtons && (
                    <>
                      <Button
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(index, 'up');
                        }}
                        size="small"
                        className="flex items-center justify-center"
                      />
                      <Button
                        icon={<ArrowDownOutlined />}
                        disabled={index === categories.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(index, 'down');
                        }}
                        size="small"
                        className="flex items-center justify-center"
                      />
                    </>
                  )}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setIsServiceModalVisible(true);
                    }}
                    size="small"
                    className="flex items-center"
                  >
                    Ajouter
                  </Button>
                  <Tooltip title="Supprimer la catégorie">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategoryClick(category, e);
                      }}
                      size="small"
                      className="flex items-center justify-center"
                    />
                  </Tooltip>
                </div>
              </div>

              {expandedCategories.includes(category.id) && (
                <Droppable droppableId={category.id} type="SERVICE">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="p-2">
                      <List
                        dataSource={category.services as Service[]}
                        renderItem={(service: Service, index) => {
                          return (
                            <Draggable key={service.id} draggableId={service.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="mb-2"
                                >
                                  <List.Item className="p-0">
                                    <div className="w-full flex items-start">
                                      <div 
                                        {...provided.dragHandleProps} 
                                        className="cursor-move flex items-center h-full pt-2 px-1"
                                      >
                                        <GripVertical className="text-gray-400 hover:text-gray-600 h-4 w-4" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="border rounded-lg overflow-hidden">
                                          <div className="bg-gray-50 py-1 px-3 flex justify-between items-center h-8">
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  setExpandedServices(
                                                    expandedServices.includes(service.id)
                                                      ? expandedServices.filter(id => id !== service.id)
                                                      : [...expandedServices, service.id]
                                                  );
                                                }}
                                                className="text-gray-500 hover:text-blue-500 flex items-center justify-center w-5 h-5"
                                              >
                                                {expandedServices.includes(service.id) ? <DownOutlined /> : <RightOutlined />}
                                              </button>
                                              <span className="font-medium text-sm leading-none">{service.name}</span>
                                              {service.description && (
                                                <span className="text-gray-500 text-xs ml-2 leading-none">{service.description}</span>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-600 text-sm leading-none">Vente:</span>
                                                <InputNumber
                                                  min={0}
                                                  step={0.01}
                                                  value={service.price}
                                                  onChange={(value) => handleServiceFieldUpdate(service, 'price', value)}
                                                  formatter={value => `${value} €`}
                                                  parser={value => value ? parseFloat(value.replace(' €', '')) : 0}
                                                  className="w-28 right-aligned-input"
                                                  size="small"
                                                  controls={true}
                                                />
                                              </div>
                                              <Tooltip title="Supprimer la prestation">
                                                <span
                                                  className="text-red-500 hover:text-red-700 cursor-pointer flex items-center justify-center w-5 h-5"
                                                  onClick={(e) => handleDeleteServiceClick(service, e)}
                                                >
                                                  <DeleteOutlined />
                                                </span>
                                              </Tooltip>
                                            </div>
                                          </div>
                                          
                                          {expandedServices.includes(service.id) && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                              <h4 className="text-xs font-medium text-gray-700 mb-2 leading-none">Matériaux utilisés :</h4>
                                              
                                              <div className="mb-2 flex justify-between pr-8">
                                                <div className="flex-1"></div>
                                                <div className="flex items-center gap-4">
                                                  <div className="flex flex-col items-center w-28">
                                                    <span className="text-gray-600 leading-none">Quantité</span>
                                                  </div>
                                                  <div className="flex flex-col items-center w-28">
                                                    <span className="text-gray-600 leading-none">Prix d'achat</span>
                                                  </div>
                                                  <div className="flex flex-col items-center w-28">
                                                    <span className="text-gray-600 leading-none">Prix de vente</span>
                                                  </div>
                                                  <div className="flex flex-col items-center w-20">
                                                    <span className="text-gray-600 leading-none">À choisir</span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <div className="space-y-1">
                                                {service.materials?.sort((a, b) => a.id.localeCompare(b.id)).map((material) => (
                                                  <div key={material.id} className="flex justify-between items-center text-xs h-auto py-1">
                                                    <div className="flex items-center gap-2 flex-1">
                                                      <span className="font-medium leading-none">{material.name}</span>
                                                      <div className="flex items-center gap-1">
                                                        {((material as any).toChoose) ? (
                                                          <span className="text-blue-500 leading-none">(À choisir)</span>
                                                        ) : (
                                                          material.reference && (
                                                            <span className="text-gray-500 leading-none">Réf: {material.reference}</span>
                                                          )
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                      <div className="w-28">
                                                        <div className="flex items-center">
                                                          <InputNumber
                                                            min={0}
                                                            step={1}
                                                            value={material.quantity}
                                                            onChange={(value) => {
                                                              if (value !== null) {
                                                                handleMaterialFieldUpdate(material.id, 'quantity', value);
                                                              }
                                                            }}
                                                            className="w-28 right-aligned-input"
                                                            size="small"
                                                            controls={true}
                                                            addonAfter={material.unit || '-'}
                                                          />
                                                        </div>
                                                      </div>
                                                      <div className="w-28">
                                                        <InputNumber
                                                          min={0}
                                                          step={1}
                                                          value={material.price}
                                                          onChange={(value) => {
                                                            if (value !== null) {
                                                              handleMaterialFieldUpdate(material.id, 'price', value);
                                                            }
                                                          }}
                                                          formatter={value => `${value} €`}
                                                          parser={value => value ? parseFloat(value.replace(' €', '')) : 0}
                                                          className="w-28 right-aligned-input"
                                                          size="small"
                                                        />
                                                      </div>
                                                      <div className="w-28">
                                                        <InputNumber
                                                          min={0}
                                                          step={1}
                                                          value={(material as any).sellingPrice || material.price}
                                                          onChange={(value) => {
                                                            if (value !== null) {
                                                              handleMaterialFieldUpdate(material.id, 'sellingPrice', value);
                                                            }
                                                          }}
                                                          formatter={value => `${value} €`}
                                                          parser={value => value ? parseFloat(value.replace(' €', '')) : 0}
                                                          className="w-28 right-aligned-input"
                                                          size="small"
                                                        />
                                                      </div>
                                                      <div className="w-20 flex justify-center">
                                                        <Checkbox
                                                          checked={(material as any).toChoose || false}
                                                          onChange={(e) => handleMaterialFieldUpdate(material.id, 'toChoose', e.target.checked)}
                                                          className="flex items-center"
                                                        />
                                                      </div>
                                                      <Tooltip title="Supprimer le matériau">
                                                        <span
                                                          className="text-red-500 hover:text-red-700 cursor-pointer ml-1 flex items-center justify-center w-5 h-5"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteMaterialClick({
                                                              id: material.id,
                                                              name: material.name
                                                            }, service.id);
                                                          }}
                                                        >
                                                          <DeleteOutlined />
                                                        </span>
                                                      </Tooltip>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                              <div className="mt-2">
                                                <Button
                                                  type="dashed"
                                                  icon={<PlusOutlined />}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedServiceForMaterial(service);
                                                    setIsMaterialModalVisible(true);
                                                  }}
                                                  size="small"
                                                  className="flex items-center"
                                                >
                                                  Ajouter un matériau
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </List.Item>
                                </div>
                              )}
                            </Draggable>
                          );
                        }}
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      <Modal
        title="Nouvelle Catégorie"
        open={isCategoryModalVisible}
        onCancel={() => setIsCategoryModalVisible(false)}
        footer={null}
      >
        <CategoryForm
          catalogId={catalog.id}
          onSubmit={handleCreateCategory}
          isLoading={isSubmitting}
        />
      </Modal>

      {selectedCategory && (
        <Modal
          title="Nouvelle Prestation"
          open={isServiceModalVisible}
          onCancel={() => {
            setIsServiceModalVisible(false);
            setSelectedCategory(null);
          }}
          footer={null}
          width={800}
        >
          <ServiceForm
            categoryId={selectedCategory.id}
            products={products}
            onSubmit={handleCreateService}
            isLoading={isSubmitting}
          />
        </Modal>
      )}

      <MaterialSelector
        visible={isMaterialModalVisible && selectedServiceForMaterial !== null}
        onCancel={() => setIsMaterialModalVisible(false)}
        onSelect={handleAddMaterial}
      />

      {confirmationModal && (
        <Modal
          title={confirmationModal.title}
          open={confirmationModal.open}
          onOk={confirmationModal.onConfirm}
          onCancel={confirmationModal.onCancel}
          okText={confirmationModal.okText}
          cancelText={confirmationModal.cancelText}
          okButtonProps={confirmationModal.okButtonProps}
        >
          {confirmationModal.content}
        </Modal>
      )}
    </div>
  );
};

export default CatalogDetail; 
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Input, InputNumber, Select, Button, Modal } from 'antd';
import { Product } from '@/types/Product';
import { deleteService } from '@/services/api'; // Ajustez le chemin d'importation selon votre structure
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

// Interface pour les valeurs du formulaire
interface ServiceFormValues {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit?: string;
  materials: Array<{ productId: string; quantity: number }>;
  serviceId?: string;
}

interface ServiceFormProps {
  categoryId: string;
  products: Product[];
  onSubmit: (values: ServiceFormValues) => void;
  isLoading?: boolean;
  onDelete?: () => void;
  onCloseParentModal?: () => void;
  onUpdateProduct?: (product: Product) => Promise<Product>;
  initialValues?: Partial<ServiceFormValues>;
}

const ServiceForm: React.FC<ServiceFormProps> = ({
  products,
  onSubmit,
  isLoading,
  onDelete,
  onCloseParentModal,
  onUpdateProduct,
  initialValues
}) => {
  const [form] = Form.useForm();
  const [selectedService, setSelectedService] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMaterialEditModalOpen, setIsMaterialEditModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Product | null>(null);
  const [materialForm] = Form.useForm();
  const [searchText, setSearchText] = useState<string>('');
  const [serviceSearchText, setServiceSearchText] = useState<string>('');
  const [materialOptions, setMaterialOptions] = useState<{value: string, label: string}[]>([]);
  const [isServiceCreateModalOpen, setIsServiceCreateModalOpen] = useState(false);
  const [serviceForm] = Form.useForm();
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [serviceOptions, setServiceOptions] = useState<{value: string, label: string}[]>([]);
  const serviceSelectRef = useRef<Select>(null);
  const [_forceRender, setForceRender] = useState<number>(0);

  console.log('ServiceForm props:', { 
    productsLength: products?.length, 
    onSubmit: !!onSubmit, 
    isLoading, 
    onDelete: !!onDelete, 
    onCloseParentModal: !!onCloseParentModal, 
    onUpdateProduct: !!onUpdateProduct 
  });

  useEffect(() => {
    setLocalProducts(products);
    
    console.log('ServiceForm - Produits reçus:', products?.length);
    console.log('ServiceForm - Catégories des produits:', products?.map(p => p.category).filter((v, i, a) => a.indexOf(v) === i));
    
    // Vérifier les matériaux
    const materials = products?.filter(p => p.category === 'MATERIAL') || [];
    console.log('ServiceForm - Matériaux filtrés:', materials.length);
    
    // Mettre à jour les options de matériaux
    setMaterialOptions(materials.map(product => ({
      value: product.id,
      label: product.name
    })));
    
    // Vérifier les services
    const services = products?.filter(p => p.category === 'SERVICE') || [];
    console.log('ServiceForm - Services filtrés:', services.length);
    
    // Mettre à jour les options de services
    setServiceOptions(services.map(product => ({
      value: product.id,
      label: product.name
    })));
  }, [products]);

  // Initialiser le formulaire avec les valeurs initiales
  useEffect(() => {
    if (initialValues) {
      console.log('Initialisation du formulaire avec les valeurs:', initialValues);
      form.setFieldsValue(initialValues);
      
      // Si un nom initial est fourni, simuler une recherche et ouvrir la modale de création
      if (initialValues.name) {
        console.log('Nom initial fourni, ouverture de la modale de création:', initialValues.name);
        setServiceSearchText(initialValues.name);
        
        // Préparer le formulaire de création de service
        serviceForm.setFieldsValue({
          name: initialValues.name,
          description: initialValues.description || '',
          unit: '',
          buyingPrice: 0,
          sellingPrice: initialValues.price || 0,
        });
        
        // Ouvrir directement la modale de création de service
        setTimeout(() => {
          setIsServiceCreateModalOpen(true);
        }, 100);
      }
    }
  }, [initialValues, form, serviceForm]);

  const effectiveUpdateProduct = onUpdateProduct || (async (product: Product) => {
    console.warn('Utilisation de la fonction de mise à jour factice. La prop onUpdateProduct n\'est pas fournie.');
    
    try {
      // Créer un objet minimal avec seulement les champs nécessaires
      const minimalProduct = {
        id: product.id,
        name: product.name,
        description: product.description || '',
        reference: product.reference || '',
        unit: product.unit || '',
        cost: product.buyingPrice || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        category: 'MATERIAL'
      };
      
      console.log('Envoi des données minimales à l\'API:', minimalProduct);
      
      // Utiliser l'API fetch avec des options plus robustes
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(minimalProduct),
        credentials: 'include'
      });
      
      // Gérer les erreurs de manière plus détaillée
      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (_e) {
          // Si la réponse n'est pas du JSON, utiliser le texte brut
          const errorText = await response.text();
          if (errorText) errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Traiter la réponse
      const responseData = await response.json();
      console.log('Réponse de l\'API:', responseData);
      return responseData;
    } catch (error) {
      console.error('Erreur détaillée:', error);
      // Remonter l'erreur pour qu'elle soit gérée par le composant
      throw error;
    }
  });

  // Filtrer les produits de type SERVICE
  const _serviceProducts = localProducts.filter(p => p.category === 'SERVICE');

  const handleServiceSelect = (productId: string) => {
    console.log('Sélection de la prestation:', productId);
    const service = localProducts.find(p => p.id === productId);
    if (service) {
      console.log('Prestation trouvée:', service);
      console.log('Unité de la prestation:', service.unit);
      setSelectedService(service);
      const formValues = {
        serviceId: service.id,
        name: service.name,
        description: service.description || '',
        price: service.sellingPrice,
        quantity: 1,
        unit: service.unit !== null && service.unit !== undefined ? service.unit : '',
      };
      console.log('Valeurs du formulaire à définir:', formValues);
      form.setFieldsValue(formValues);
    } else {
      console.warn('Prestation non trouvée avec l\'ID:', productId);
    }
  };

  const handleSubmit = (values: ServiceFormValues) => {
    // Inclure le serviceId dans les données soumises si un service a été sélectionné
    onSubmit({
      ...values,
      serviceId: selectedService?.id,
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!selectedService?.id) return;
      
      await deleteService(selectedService.id);
      setIsDeleteModalOpen(false);
      form.resetFields();
      setSelectedService(null);
      if (onDelete) {
        onDelete();
        // Fermer la modale parente si nécessaire
        if (onCloseParentModal) {
          onCloseParentModal();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      Modal.error({
        title: 'Erreur',
        content: 'Une erreur est survenue lors de la suppression de la prestation'
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleMaterialSelect = (productId: string, fieldName: number) => {
    console.log('Sélection du matériau:', productId, 'pour le champ:', fieldName);
    const material = localProducts.find(p => p.id === productId);
    if (material) {
      console.log('Matériau trouvé:', material);
      // Mettre à jour le champ avec le matériau sélectionné
      form.setFieldValue(['materials', fieldName, 'productId'], material.id);
      
      // Forcer la mise à jour de l'affichage du Select
      const selectElement = document.querySelector(`[id="materials_${fieldName}_productId"]`);
      if (selectElement) {
        // Mettre à jour l'affichage du Select
        const labelElement = selectElement.querySelector('.ant-select-selection-item');
        if (labelElement) {
          labelElement.textContent = material.name;
        }
      }
    } else {
      console.warn('Matériau non trouvé avec l\'ID:', productId);
    }
  };

  const handleEditMaterial = (productId: string) => {
    const material = localProducts.find(p => p.id === productId);
    if (material) {
      setSelectedMaterial(material);
      materialForm.setFieldsValue({
        name: material.name,
        description: material.description,
        reference: material.reference || '',
        unit: material.unit || '',
        buyingPrice: material.cost || 0,
        sellingPrice: material.sellingPrice || 0,
      });
      setIsMaterialEditModalOpen(true);
    } else {
      console.error('Matériau non trouvé:', productId);
      Modal.error({
        title: 'Erreur',
        content: 'Matériau non trouvé'
      });
    }
  };

  const handleCreateMaterial = (fieldIndex: number) => {
    // Stocker l'index du champ actuel
    form.setFieldValue('currentFieldIndex', fieldIndex);
    
    materialForm.setFieldsValue({
      name: searchText,
      description: '',
      reference: '',
      unit: '',
      buyingPrice: 0,
      sellingPrice: 0,
    });
    
    setSelectedMaterial(null);
    setIsMaterialEditModalOpen(true);
  };

  const handleMaterialEditSubmit = async () => {
    try {
      console.log('Validation des champs du formulaire...');
      const values = await materialForm.validateFields();
      console.log('Valeurs du formulaire:', values);
      
      // Convertir explicitement les valeurs numériques
      const processedValues = {
        ...values,
        buyingPrice: Number(values.buyingPrice),
        sellingPrice: Number(values.sellingPrice)
      };
      
      try {
        if (selectedMaterial) {
          console.log('Mise à jour du matériau existant');
          const updatedMaterial = await effectiveUpdateProduct({
            ...selectedMaterial,
            ...processedValues,
          });
          console.log('Matériau mis à jour:', updatedMaterial);
          
          Modal.success({
            title: 'Succès',
            content: 'Le matériau a été mis à jour avec succès'
          });
        } else {
          console.log('Création d\'un nouveau matériau');
          const newMaterialData = {
            name: processedValues.name,
            description: processedValues.description || '',
            reference: processedValues.reference || '',
            unit: processedValues.unit || '',
            cost: processedValues.buyingPrice,
            sellingPrice: processedValues.sellingPrice,
            category: 'MATERIAL'
          };
          
          console.log('Données pour la création:', newMaterialData);
          
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMaterialData),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Réponse d\'erreur de l\'API:', response.status, errorText);
            throw new Error(`Erreur lors de la création du matériau: ${response.status} ${errorText}`);
          }
          
          const newMaterial = await response.json();
          console.log('Nouveau matériau créé:', newMaterial);
          
          // Ajouter le nouveau matériau à la liste des produits
          updateProductsList(newMaterial);
          
          // Émettre un événement personnalisé pour informer que le matériau a été créé
          window.dispatchEvent(new CustomEvent('materialCreated', {
            detail: {
              material: {
                ...newMaterial,
                quantity: 1 // Ajouter une quantité par défaut
              }
            }
          }));
          
          // Sélectionner automatiquement le nouveau matériau dans le champ de sélection
          const currentFieldIndex = form.getFieldValue('currentFieldIndex') || 0;
          
          // Mettre à jour le champ de sélection avec le nouveau matériau
          form.setFieldValue(['materials', currentFieldIndex, 'productId'], newMaterial.id);
          
          // Mettre à jour également la quantité du matériau (par défaut à 1)
          form.setFieldValue(['materials', currentFieldIndex, 'quantity'], 1);
          
          // Forcer la mise à jour de l'affichage du Select
          // Cette étape est nécessaire pour que le Select affiche le nom du matériau
          setTimeout(() => {
            // Récupérer l'élément Select et déclencher un événement de changement
            const selectElement = document.querySelector(`[id="materials_${currentFieldIndex}_productId"]`);
            if (selectElement) {
              // Créer et déclencher un événement de changement
              const event = new Event('change', { bubbles: true });
              selectElement.dispatchEvent(event);
              
              // Déclencher manuellement la fonction handleMaterialSelect pour ajouter le matériau
              handleMaterialSelect(newMaterial.id, currentFieldIndex);
              
              // Afficher un message de succès
              Modal.success({
                title: 'Succès',
                content: 'Le matériau a été créé avec succès et ajouté à la prestation'
              });
            } else {
              // Afficher un message de succès
              Modal.success({
                title: 'Succès',
                content: 'Le matériau a été créé avec succès'
              });
            }
          }, 100);
          
          setIsMaterialEditModalOpen(false);
          setSelectedMaterial(null);
          setSearchText('');
          
        }
      } catch (error: any) {
        console.error('Erreur lors de l\'opération sur le matériau:', error);
        
        Modal.error({
          title: 'Erreur',
          content: `Une erreur est survenue: ${error.message || 'Erreur inconnue'}`
        });
      }
    } catch (validationError) {
      console.error('Erreur de validation du formulaire:', validationError);
      Modal.error({
        title: 'Erreur de validation',
        content: 'Veuillez vérifier les champs du formulaire'
      });
    }
  };

  const handleCreateService = () => {
    serviceForm.setFieldsValue({
      name: serviceSearchText,
      description: '',
      unit: '',
      buyingPrice: 0,
      sellingPrice: 0,
    });
    
    setIsServiceCreateModalOpen(true);
  };

  // Fonction pour forcer le rendu du composant
  const forceComponentRender = useCallback(() => {
    setForceRender(prev => prev + 1);
  }, []);

  const handleServiceCreateSubmit = async () => {
    try {
      const values = await serviceForm.validateFields();
      
      // Convertir explicitement les valeurs numériques
      const processedValues = {
        ...values,
        buyingPrice: Number(values.buyingPrice),
        sellingPrice: Number(values.sellingPrice)
      };
      
      try {
        const newServiceData = {
          name: processedValues.name,
          description: processedValues.description || '',
          unit: processedValues.unit || '',
          cost: processedValues.buyingPrice,
          sellingPrice: processedValues.sellingPrice,
          category: 'SERVICE'
        };
        
        console.log('Création d\'une nouvelle prestation:', newServiceData);
        
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newServiceData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur lors de la création de la prestation: ${response.status} ${errorText}`);
        }
        
        const newService = await response.json();
        console.log('Nouvelle prestation créée avec succès:', newService);
        
        // Fermer la modale de création
        setIsServiceCreateModalOpen(false);
        
        // Ajouter le nouveau service à la liste locale des produits
        const updatedProducts = [...localProducts, newService];
        setLocalProducts(updatedProducts);
        
        // Mettre à jour les options de services
        const newServiceOptions = [
          ...serviceOptions,
          {
            value: newService.id,
            label: newService.name
          }
        ];
        setServiceOptions(newServiceOptions);
        
        // Informer le composant parent de la mise à jour
        window.dispatchEvent(new CustomEvent('productsUpdated', { detail: updatedProducts }));
        
        // Sélectionner explicitement la nouvelle prestation dans le formulaire
        console.log('Mise à jour du formulaire avec la nouvelle prestation:', newService.id);
        
        // Mettre à jour l'état sélectionné immédiatement
        setSelectedService(newService);
        
        // Mettre à jour directement les champs du formulaire
        form.setFieldsValue({
          serviceId: newService.id,
          name: newService.name,
          description: newService.description || '',
          price: newService.sellingPrice,
          quantity: 1,
          unit: newService.unit || '',
        });
        
        // Forcer le rendu du composant
        forceComponentRender();
        
        // Afficher un message de succès
        Modal.success({
          title: 'Succès',
          content: 'La prestation a été créée avec succès et sélectionnée'
        });
        
        // Réinitialiser le texte de recherche
        setServiceSearchText('');
        
      } catch (error: any) {
        console.error('Erreur lors de la création de la prestation:', error);
        
        Modal.error({
          title: 'Erreur',
          content: `Une erreur est survenue: ${error.message || 'Erreur inconnue'}`
        });
      }
    } catch (validationError) {
      console.error('Erreur de validation du formulaire:', validationError);
      Modal.error({
        title: 'Erreur de validation',
        content: 'Veuillez vérifier les champs du formulaire'
      });
    }
  };

  // Modifions la fonction updateProductsList pour mettre à jour les options
  const updateProductsList = (newProduct: Product) => {
    // Vérifier si le produit existe déjà
    const existingIndex = localProducts.findIndex(p => p.id === newProduct.id);
    
    let updatedProducts: Product[];
    
    if (existingIndex >= 0) {
      // Mettre à jour le produit existant
      updatedProducts = [...localProducts];
      updatedProducts[existingIndex] = newProduct;
    } else {
      // Ajouter le nouveau produit
      updatedProducts = [...localProducts, newProduct];
    }
    
    // Mettre à jour la liste locale des produits
    setLocalProducts(updatedProducts);
    
    // Mettre à jour les options appropriées
      if (newProduct.category === 'MATERIAL') {
      setMaterialOptions(prev => {
        const existingOptionIndex = prev.findIndex(opt => opt.value === newProduct.id);
        if (existingOptionIndex >= 0) {
          const newOptions = [...prev];
          newOptions[existingOptionIndex] = {
            value: newProduct.id,
            label: newProduct.name
          };
          return newOptions;
        } else {
          return [
          ...prev,
          {
            value: newProduct.id,
            label: newProduct.name
          }
          ];
        }
      });
    } else if (newProduct.category === 'SERVICE') {
      setServiceOptions(prev => {
        const existingOptionIndex = prev.findIndex(opt => opt.value === newProduct.id);
        if (existingOptionIndex >= 0) {
          const newOptions = [...prev];
          newOptions[existingOptionIndex] = {
            value: newProduct.id,
            label: newProduct.name
          };
          return newOptions;
        } else {
          return [
            ...prev,
            {
              value: newProduct.id,
              label: newProduct.name
            }
          ];
        }
      });
    }
    
    // Informer le composant parent de la mise à jour
    window.dispatchEvent(new CustomEvent('productsUpdated', { detail: updatedProducts }));
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          materials: [],
          quantity: 1,
        }}
      >
        <Form.Item
          name="serviceId"
          label="Sélectionner une prestation existante"
        >
          <Select
            ref={serviceSelectRef}
            showSearch
            placeholder="Rechercher une prestation"
            optionFilterProp="children"
            onChange={handleServiceSelect}
            onSearch={setServiceSearchText}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={serviceOptions}
            notFoundContent={
              serviceSearchText ? (
                <div style={{ padding: '8px', textAlign: 'center' }}>
                  <div>Aucun résultat trouvé</div>
                  <Button 
                    type="link" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCreateService();
                    }}
                    style={{ padding: '4px 0' }}
                  >
                    Créer la prestation &quot;{serviceSearchText}&quot;
                  </Button>
                </div>
              ) : (
                <div style={{ padding: '8px', textAlign: 'center' }}>Aucun résultat</div>
              )
            }
            listHeight={300}
            dropdownStyle={{ width: '750px' }}
            popupMatchSelectWidth={false}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Nom"
          rules={[{ required: true, message: 'Le nom est requis' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantité"
          rules={[{ required: true, message: 'La quantité est requise' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="Quantité"
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Unité"
        >
          <Input placeholder="ex: m², h, forfait, etc." />
        </Form.Item>

        <Form.Item
          name="price"
          label="Prix"
          rules={[{ required: true, message: 'Le prix est requis' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            formatter={value => `${value} €`}
            parser={(value: string | undefined) => {
              if (!value) return 0;
              const parsed = value.replace(/[^\d.]/g, '');
              return parsed ? Number(parsed) : 0;
            }}
          />
        </Form.Item>

        <Form.List name="materials">
          {(fields, { add, remove }) => (
            <div style={{ width: '100%' }}>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'productId']}
                    rules={[{ required: true, message: 'Sélectionnez un matériau' }]}
                    style={{ flex: 6, marginBottom: 0 }}
                  >
                    <Select 
                      showSearch
                      placeholder="Sélectionner un matériau"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      onChange={(value) => handleMaterialSelect(value, name)}
                      onSearch={setSearchText}
                      notFoundContent={
                        searchText ? (
                          <div style={{ padding: '8px', textAlign: 'center' }}>
                            <div>Aucun résultat trouvé</div>
                            <Button 
                              type="link" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleCreateMaterial(name);
                              }}
                              style={{ padding: '4px 0' }}
                            >
                              Créer le matériau "{searchText}"
                            </Button>
                          </div>
                        ) : (
                          <div style={{ padding: '8px', textAlign: 'center' }}>Aucun résultat</div>
                        )
                      }
                      options={materialOptions}
                      listHeight={300}
                      dropdownStyle={{ width: '750px' }}
                      popupMatchSelectWidth={false}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[{ required: true, message: 'Quantité requise' }]}
                    style={{ flex: 2, marginBottom: 0 }}
                  >
                    <InputNumber
                      min={1}
                      placeholder="Quantité"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Button
                    onClick={() => remove(name)}
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ marginTop: '4px' }}
                  />
                  <Button
                    onClick={() => {
                      const productId = form.getFieldValue(['materials', name, 'productId']);
                      if (productId) {
                        handleEditMaterial(productId);
                      } else {
                        message.warning('Veuillez d\'abord sélectionner un matériau');
                      }
                    }}
                    type="text"
                    icon={<EditOutlined />}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add({ quantity: 1 })}
                style={{ width: '100%', marginTop: '8px' }}
                icon={<PlusOutlined />}
              >
                Ajouter un matériau
              </Button>
              {materialOptions.length === 0 && (
                <div style={{ marginTop: '8px', color: '#ff4d4f', textAlign: 'center' }}>
                  Aucun matériau disponible. Veuillez en créer un d'abord.
                </div>
              )}
            </div>
          )}
        </Form.List>

        <Form.Item>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {selectedService ? 'Modifier' : 'Créer'}
            </Button>
            {selectedService && (
              <Button danger onClick={handleDeleteClick}>
                Supprimer
              </Button>
            )}
          </div>
        </Form.Item>
      </Form>

      <Modal
        title="Confirmation de suppression"
        open={isDeleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Confirmer"
        cancelText="Annuler"
        okButtonProps={{ danger: true }}
      >
        <p>Êtes-vous sûr de vouloir supprimer cette prestation ?</p>
      </Modal>

      <Modal
        title="Éditer le matériau"
        open={isMaterialEditModalOpen}
        onOk={handleMaterialEditSubmit}
        onCancel={() => setIsMaterialEditModalOpen(false)}
        okText="Enregistrer"
        cancelText="Annuler"
        width={600}
      >
        <Form
          form={materialForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="reference"
            label="Référence"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unité"
          >
            <Input placeholder="ex: kg, m, pièce, etc." />
          </Form.Item>

          <Form.Item
            name="buyingPrice"
            label="Prix d'achat"
            rules={[{ required: true, message: 'Le prix d\'achat est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                // Convertir en chaîne et remplacer le point par une virgule
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                // Supprimer tout sauf les chiffres et la virgule, puis convertir la virgule en point
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>

          <Form.Item
            name="sellingPrice"
            label="Prix de vente"
            rules={[{ required: true, message: 'Le prix de vente est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                // Convertir en chaîne et remplacer le point par une virgule
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                // Supprimer tout sauf les chiffres et la virgule, puis convertir la virgule en point
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Créer une prestation"
        open={isServiceCreateModalOpen}
        onOk={handleServiceCreateSubmit}
        onCancel={() => setIsServiceCreateModalOpen(false)}
        okText="Créer"
        cancelText="Annuler"
        width={600}
      >
        <Form
          form={serviceForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unité"
          >
            <Input placeholder="ex: h, forfait, etc." />
          </Form.Item>

          <Form.Item
            name="buyingPrice"
            label="Prix d'achat"
            rules={[{ required: true, message: 'Le prix d\'achat est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                // Convertir en chaîne et remplacer le point par une virgule
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                // Supprimer tout sauf les chiffres et la virgule, puis convertir la virgule en point
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>

          <Form.Item
            name="sellingPrice"
            label="Prix de vente"
            rules={[{ required: true, message: 'Le prix de vente est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                // Convertir en chaîne et remplacer le point par une virgule
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                // Supprimer tout sauf les chiffres et la virgule, puis convertir la virgule en point
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ServiceForm; 
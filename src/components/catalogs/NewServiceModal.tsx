'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message, Spin } from 'antd';
import { Product } from '@/types/Product';
import { createService } from '@/services/api';
import MaterialEditModal from './MaterialEditModal';

const { TextArea } = Input;
const { Option } = Select;

interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
}

interface NewServiceModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (newService: any) => void;
  categoryId: string;
  catalogId: string;
  products: Product[];
  onUpdateProduct?: (product: Product) => Promise<Product>;
  initialName?: string;
}

const NewServiceModal: React.FC<NewServiceModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  categoryId,
  catalogId,
  products,
  onUpdateProduct,
  initialName = ''
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [materialEditModalVisible, setMaterialEditModalVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Product | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [searchText, setSearchText] = useState<string>('');
  const [materialOptions, setMaterialOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    const options = localProducts
      .filter(product => 
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (product.reference || '').toLowerCase().includes(searchText.toLowerCase())
      )
      .map(product => ({
        value: product.id,
        label: `${product.name} (${product.reference || 'Sans réf.'}) - ${product.sellingPrice}€/${product.unit}`
      }));
    setMaterialOptions(options);
  }, [localProducts, searchText]);

  useEffect(() => {
    if (initialName) {
      console.log(`Initialisation du formulaire avec le nom: "${initialName}"`);
      form.setFieldsValue({ name: initialName });
    }
  }, [initialName, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);

      // Vérifier que les données sont valides
      if (!values.name) {
        message.error('Le nom de la prestation est obligatoire');
        setIsLoading(false);
        return;
      }

      if (!categoryId) {
        message.error('Veuillez sélectionner une catégorie');
        setIsLoading(false);
        return;
      }

      if (!catalogId) {
        message.error('Veuillez sélectionner un catalogue');
        setIsLoading(false);
        return;
      }

      // Préparer les matériaux pour l'API
      const materials = values.materials?.map((material: any) => ({
        productId: material.productId,
        quantity: material.quantity || 1
      })) || [];

      // Appel API pour créer le service
      try {
        console.log('Création de la prestation en cours...');
        const response = await createService({
          catalogId,
          categoryId,
          name: values.name,
          description: values.description,
          price: values.price,
          materials
        });

        if (response) {
          console.log('Prestation créée avec succès:', response);
          message.success('Prestation créée avec succès');
          form.resetFields();
          onSuccess(response);
        } else {
          throw new Error('Réponse vide du serveur');
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel API:', apiError);
        message.error('Erreur lors de la création de la prestation. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la prestation:', error);
      message.error('Erreur lors de la validation du formulaire. Veuillez vérifier les champs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaterialSelect = (productId: string, fieldName: number) => {
    const product = localProducts.find(p => p.id === productId);
    if (product) {
      const materials = form.getFieldValue('materials') || [];
      materials[fieldName] = {
        ...materials[fieldName],
        productId,
        name: product.name,
        price: product.sellingPrice,
        unit: product.unit
      };
      form.setFieldsValue({ materials });
    }
  };

  const handleEditMaterial = (productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (product) {
      setSelectedMaterial(product);
      setMaterialEditModalVisible(true);
    }
  };

  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setMaterialEditModalVisible(true);
  };

  const handleMaterialEditSuccess = (updatedProduct: Product) => {
    setMaterialEditModalVisible(false);
    
    // Mettre à jour la liste locale des produits
    const updatedProducts = localProducts.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    
    if (!updatedProducts.some(p => p.id === updatedProduct.id)) {
      updatedProducts.push(updatedProduct);
    }
    
    setLocalProducts(updatedProducts);
    
    // Mettre à jour les options de matériaux
    const options = updatedProducts.map(product => ({
      value: product.id,
      label: `${product.name} (${product.reference || 'Sans réf.'}) - ${product.sellingPrice}€/${product.unit}`
    }));
    setMaterialOptions(options);
  };

  return (
    <>
      <Modal
        title="Nouvelle Prestation"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="cancel" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>,
          <Button key="submit" type="primary" loading={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Création en cours...' : 'Créer'}
          </Button>
        ]}
        width={800}
        maskClosable={!isLoading}
        closable={!isLoading}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#1890ff' }}>
              Création de la prestation en cours...
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ 
              name: initialName,
              materials: [{ quantity: 1 }] 
            }}
          >
            <Form.Item
              name="name"
              label="Nom de la prestation"
              rules={[{ required: true, message: 'Veuillez saisir le nom de la prestation' }]}
            >
              <Input placeholder="Nom de la prestation" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} placeholder="Description de la prestation" />
            </Form.Item>

            <Form.Item
              name="price"
              label="Prix unitaire (€)"
              rules={[{ required: true, message: 'Veuillez saisir le prix' }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="Prix unitaire"
              />
            </Form.Item>

            <div className="materials-section">
              <div className="section-header">
                <h3>Matériaux</h3>
                <Button type="link" onClick={() => {
                  const materials = form.getFieldValue('materials') || [];
                  form.setFieldsValue({ materials: [...materials, { quantity: 1 }] });
                }}>
                  Ajouter un matériau
                </Button>
              </div>

              <Form.List name="materials">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.key} className="material-row">
                        <Form.Item
                          {...field}
                          name={[field.name, 'productId']}
                          label="Matériau"
                          rules={[{ required: true, message: 'Sélectionnez un matériau' }]}
                        >
                          <Select
                            showSearch
                            placeholder="Sélectionner un matériau"
                            optionFilterProp="children"
                            onChange={(value) => handleMaterialSelect(value, field.name)}
                            onSearch={setSearchText}
                            filterOption={false}
                            options={materialOptions}
                            dropdownRender={(menu) => (
                              <>
                                {menu}
                                <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                  <Button type="link" onClick={() => handleCreateMaterial()}>
                                    Créer un nouveau matériau
                                  </Button>
                                  <Button 
                                    type="link" 
                                    onClick={() => {
                                      const productId = form.getFieldValue(['materials', field.name, 'productId']);
                                      if (productId) handleEditMaterial(productId);
                                    }}
                                  >
                                    Éditer ce matériau
                                  </Button>
                                </div>
                              </>
                            )}
                          />
                        </Form.Item>

                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="Quantité"
                          initialValue={1}
                          rules={[{ required: true, message: 'Saisissez une quantité' }]}
                        >
                          <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} />
                        </Form.Item>

                        <Button
                          type="text"
                          danger
                          onClick={() => remove(field.name)}
                          style={{ marginTop: '30px' }}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </div>
          </Form>
        )}
      </Modal>

      {materialEditModalVisible && (
        <MaterialEditModal
          visible={materialEditModalVisible}
          onCancel={() => setMaterialEditModalVisible(false)}
          onSuccess={handleMaterialEditSuccess}
          product={selectedMaterial}
          onUpdateProduct={onUpdateProduct}
        />
      )}
    </>
  );
};

export default NewServiceModal; 
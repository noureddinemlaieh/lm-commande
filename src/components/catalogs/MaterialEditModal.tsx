'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Button, message } from 'antd';
import { Product } from '@/types/Product';
import { createProduct, updateProduct } from '@/services/api';

const { Option } = Select;

interface MaterialEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (product: Product) => void;
  product: Product | null;
  onUpdateProduct?: (product: Product) => Promise<Product>;
}

const MaterialEditModal: React.FC<MaterialEditModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  product,
  onUpdateProduct
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        reference: product.reference,
        sellingPrice: product.sellingPrice,
        unit: product.unit,
        category: product.category
      });
    } else {
      form.resetFields();
    }
  }, [product, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);

      // Vérifier que les données sont valides
      if (!values.name) {
        message.error('Le nom du matériau est obligatoire');
        return;
      }

      if (!values.sellingPrice) {
        message.error('Le prix du matériau est obligatoire');
        return;
      }

      if (!values.unit) {
        message.error('L\'unité du matériau est obligatoire');
        return;
      }

      let response;
      try {
        if (isEditing && product) {
          // Si on utilise la fonction onUpdateProduct fournie par le parent
          if (onUpdateProduct) {
            response = await onUpdateProduct({
              ...product,
              name: values.name,
              reference: values.reference,
              sellingPrice: values.sellingPrice,
              unit: values.unit,
              category: values.category
            });
          } else {
            // Sinon, utiliser l'API directement
            response = await updateProduct({
              id: product.id,
              name: values.name,
              reference: values.reference,
              sellingPrice: values.sellingPrice,
              unit: values.unit,
              category: values.category
            });
          }
          message.success('Matériau mis à jour avec succès');
        } else {
          // Création d'un nouveau produit
          response = await createProduct({
            name: values.name,
            reference: values.reference,
            sellingPrice: values.sellingPrice,
            unit: values.unit,
            category: values.category
          });
          message.success('Matériau créé avec succès');
        }

        if (response) {
          form.resetFields();
          onSuccess(response);
        } else {
          throw new Error('Réponse vide du serveur');
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel API:', apiError);
        message.error('Erreur lors de la sauvegarde du matériau. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du matériau:', error);
      message.error('Erreur lors de la validation du formulaire. Veuillez vérifier les champs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Éditer le matériau" : "Nouveau matériau"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button key="submit" type="primary" loading={isLoading} onClick={handleSubmit}>
          {isEditing ? "Mettre à jour" : "Créer"}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="Nom du matériau"
          rules={[{ required: true, message: 'Veuillez saisir le nom du matériau' }]}
        >
          <Input placeholder="Nom du matériau" />
        </Form.Item>

        <Form.Item
          name="reference"
          label="Référence"
        >
          <Input placeholder="Référence du matériau" />
        </Form.Item>

        <Form.Item
          name="sellingPrice"
          label="Prix (€)"
          rules={[{ required: true, message: 'Veuillez saisir le prix' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="Prix"
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="Unité"
          rules={[{ required: true, message: 'Veuillez sélectionner une unité' }]}
        >
          <Select placeholder="Sélectionner une unité">
            <Option value="u">Unité (u)</Option>
            <Option value="m">Mètre (m)</Option>
            <Option value="m²">Mètre carré (m²)</Option>
            <Option value="m3">Mètre cube (m3)</Option>
            <Option value="kg">Kilogramme (kg)</Option>
            <Option value="l">Litre (l)</Option>
            <Option value="h">Heure (h)</Option>
            <Option value="j">Jour (j)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="category"
          label="Catégorie"
        >
          <Input placeholder="Catégorie du matériau" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MaterialEditModal; 
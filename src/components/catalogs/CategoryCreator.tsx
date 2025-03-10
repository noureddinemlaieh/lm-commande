'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Spin } from 'antd';
import { createCategory } from '@/services/api';

interface CategoryCreatorProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (category: any) => void;
  catalogId: string;
}

const CategoryCreator: React.FC<CategoryCreatorProps> = ({
  visible,
  onCancel,
  onSuccess,
  catalogId
}) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsLoading(true);

      if (!values.name) {
        message.error('Le nom de la catégorie est obligatoire');
        return;
      }

      if (!catalogId) {
        message.error('Veuillez sélectionner un catalogue');
        return;
      }

      try {
        console.log('Création de la catégorie avec les données:', {
          name: values.name,
          description: values.description,
          catalogId: catalogId
        });
        
        const response = await createCategory({
          name: values.name,
          description: values.description,
          catalogId: catalogId
        });

        if (response) {
          console.log('Catégorie créée avec succès:', response);
          form.resetFields();
          onSuccess(response);
        } else {
          throw new Error('Réponse vide du serveur');
        }
      } catch (apiError) {
        console.error('Erreur lors de l\'appel API:', apiError);
        message.error('Erreur lors de la création de la catégorie. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      message.error('Erreur lors de la validation du formulaire. Veuillez vérifier les champs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Nouvelle catégorie"
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
      maskClosable={!isLoading}
      closable={!isLoading}
    >
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#1890ff' }}>
            Création de la catégorie en cours...
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nom de la catégorie"
            rules={[{ required: true, message: 'Veuillez saisir le nom de la catégorie' }]}
          >
            <Input placeholder="Nom de la catégorie" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} placeholder="Description de la catégorie" />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default CategoryCreator; 
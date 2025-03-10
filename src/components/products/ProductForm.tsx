'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button } from 'antd';
import { Product, ProductCategory } from '../../types/Product';

interface ProductFormProps {
  initialValues?: Product;
  onSubmit: (values: Omit<Product, 'id'>) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialValues, onSubmit, isLoading, onCancel }) => {
  const [form] = Form.useForm();
  const [category, setCategory] = useState(initialValues?.category || 'MATERIAL');

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
      });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues || { category: 'MATERIAL' }}
      onFinish={onSubmit}
    >
      <Form.Item
        name="category"
        label="Catégorie"
        rules={[{ required: true, message: 'La catégorie est requise' }]}
      >
        <Select onChange={(value) => setCategory(value)}>
          <Select.Option value="MATERIAL">Matériau</Select.Option>
          <Select.Option value="SERVICE">Service</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="name"
        label="Nom"
        rules={[{ required: true, message: 'Le nom est requis' }]}
      >
        <Input />
      </Form.Item>

      {category === 'MATERIAL' && (
        <Form.Item
          name="reference"
          label="Référence"
          tooltip="Référence unique du matériau"
        >
          <Input placeholder="Ex: MAT-001" />
        </Form.Item>
      )}

      <Form.Item
        name="unit"
        label="Unité"
        rules={[{ required: true, message: 'L\'unité est requise' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="cost"
        label="Prix d'achat"
        rules={[{ required: true, message: 'Veuillez entrer le prix d\'achat' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          formatter={(value) => `${value}`.replace('.', ',')}
          parser={(value) => {
            const parsed = parseFloat(value!.replace(',', '.') || '0');
            return isNaN(parsed) ? 0 : parsed;
          }}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="sellingPrice"
        label="Prix de vente"
        rules={[{ required: true, message: 'Veuillez entrer le prix de vente' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          formatter={(value) => `${value}`.replace('.', ',')}
          parser={(value) => {
            const parsed = parseFloat(value!.replace(',', '.') || '0');
            return isNaN(parsed) ? 0 : parsed;
          }}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {initialValues ? 'Mettre à jour' : 'Créer'}
        </Button>
        {onCancel && (
          <Button 
            onClick={onCancel} 
            style={{ marginLeft: 8 }}
          >
            Annuler
          </Button>
        )}
      </Form.Item>
    </Form>
  );
};

export default ProductForm; 
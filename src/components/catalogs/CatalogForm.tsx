'use client';

import React from 'react';
import { Form, Input, Button } from 'antd';
import { Catalog } from '@/types/Catalog';

interface CatalogFormProps {
  initialValues?: Catalog;
  onSubmit: (values: { name: string; description?: string }) => void;
  isLoading?: boolean;
}

const CatalogForm: React.FC<CatalogFormProps> = ({
  initialValues,
  onSubmit,
  isLoading
}) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSubmit}
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
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {initialValues ? 'Modifier' : 'Créer'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CatalogForm; 
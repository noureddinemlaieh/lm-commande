'use client';

import React from 'react';
import { Form, Input, Button } from 'antd';

interface CategoryFormProps {
  catalogId: string;
  onSubmit: (values: { name: string; description?: string }) => void;
  isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  isLoading
}) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
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
          Créer
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CategoryForm; 
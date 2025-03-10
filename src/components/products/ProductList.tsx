'use client';

import React from 'react';
import { Product } from '../../types/Product';
import { Table, Button } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  loading?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, loading }) => {
  // Fonction pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const columns = [
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        category === 'MATERIAL' ? 'Matériau' : 'Service'
      ),
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (_: any, record: Product) => (
        record.category === 'MATERIAL' ? record.reference || '-' : null
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Unité',
      dataIndex: 'unit',
      key: 'unit',
      align: 'right' as const,
    },
    {
      title: 'Coût',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (cost: number) => `${cost.toFixed(2)}`.replace('.', ',') + ' €'
    },
    {
      title: 'Prix de vente',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right' as const,
      render: (sellingPrice: number) => `${sellingPrice.toFixed(2)}`.replace('.', ',') + ' €'
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_, record: Product) => (
        <>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
            style={{ marginRight: 8 }}
          />
          <Button 
            icon={<DeleteOutlined />} 
            danger 
            onClick={() => onDelete(record.id)}
          />
        </>
      ),
    },
  ];

  return <Table columns={columns} dataSource={products} rowKey="id" loading={loading} />;
};

export default ProductList; 
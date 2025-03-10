'use client';

import React, { useState } from 'react';
import { message, Button } from 'antd';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';
import { productService } from '@/services/productService';
import { ArrowLeftOutlined } from '@ant-design/icons';

const NewProductPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      await productService.createProduct({
        name: values.name,
        description: values.description,
        category: values.category,
        cost: values.cost,
        unit: values.unit,
        reference: values.reference,
        sellingPrice: values.sellingPrice,
      });
      
      message.success('Produit créé avec succès');
      router.push('/products');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      message.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button 
          onClick={() => router.push('/products')} 
          icon={<ArrowLeftOutlined />}
          className="mr-4"
        >
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Nouveau Produit</h1>
      </div>
      <div className="mb-6">
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => router.push('/products')}
        />
      </div>
    </div>
  );
};

export default NewProductPage; 
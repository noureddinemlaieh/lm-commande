'use client';

import React, { useState, useEffect } from 'react';
import { message, Spin, Button } from 'antd';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';
import { productService } from '@/services/productService';
import { Product } from '@/types/Product';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

const EditProductPage: React.FC<EditProductPageProps> = ({ params }) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoadingProduct(true);
        const data = await productService.getProductById(params.id);
        
        if (!data) {
          throw new Error('Produit non trouvé');
        }
        
        setProduct(data);
      } catch (error) {
        console.error('Erreur lors du chargement du produit:', error);
        message.error('Erreur lors du chargement du produit');
        router.push('/products');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      await productService.updateProduct(params.id, {
        name: values.name,
        description: values.description,
        category: values.category,
        cost: values.cost,
        unit: values.unit,
        reference: values.reference,
        sellingPrice: values.sellingPrice,
      });
      
      message.success('Produit mis à jour avec succès');
      router.push('/products');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      message.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Chargement du produit..." />
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">Modifier le Produit</h1>
      </div>
      <div className="mb-6">
        {product && (
          <ProductForm
            initialValues={product}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={() => router.push('/products')}
          />
        )}
      </div>
    </div>
  );
};

export default EditProductPage; 
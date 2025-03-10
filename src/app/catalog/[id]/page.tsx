'use client';

import React, { useState, useEffect } from 'react';
import { Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Catalog, Product } from '@/types/Catalog';
import CatalogDetail from '@/components/catalogs/CatalogDetail';
import CatalogActions from '@/components/catalogs/CatalogActions';

interface CatalogDetailPageProps {
  params: {
    id: string;
  };
}

const CatalogDetailPage: React.FC<CatalogDetailPageProps> = ({ params }) => {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCatalog = async (id: string) => {
    try {
      const response = await fetch(`/api/catalogs/${id}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du catalogue');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement du catalogue:', error);
      throw error;
    }
  };

  const refreshCatalog = async () => {
    try {
      const updatedCatalog = await loadCatalog(params.id);
      setCatalog(updatedCatalog);
    } catch (error) {
      message.error('Erreur lors de la mise à jour du catalogue');
      console.error(error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  useEffect(() => {
    loadCatalog(params.id).then(data => {
      setCatalog(data);
    }).catch(error => {
      message.error('Erreur lors du chargement du catalogue');
      console.error(error);
    }).finally(() => {
      setLoading(false);
    });
    loadProducts();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">
          Catalogue non trouvé
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/catalog')}
            className="mr-4"
          >
            Retour aux catalogues
          </Button>
          <h1 className="text-2xl font-bold m-0">{catalog.name}</h1>
        </div>
        <CatalogActions catalogId={params.id} isDetailView={true} />
      </div>

      {catalog.description && (
        <p className="text-gray-500 mb-6">{catalog.description}</p>
      )}

      <CatalogDetail
        catalog={catalog}
        products={products}
        onUpdate={refreshCatalog}
      />
    </div>
  );
};

export default CatalogDetailPage; 
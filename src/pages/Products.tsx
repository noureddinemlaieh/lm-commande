'use client';

import React, { useState, useEffect } from 'react';
import { Button, Typography, Upload, Input, App } from 'antd';
import { useRouter } from 'next/navigation';
import ProductList from '../components/products/ProductList';
import ProductForm from '../components/products/ProductForm';
import { Product } from '../types/Product';
import { productService } from '@/services/productService';
import ExcelImporter from '../components/ExcelImporter';
import { InboxOutlined, SearchOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const ProductsPage: React.FC = () => {
  const router = useRouter();
  const { message } = App.useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      message.error('Erreur lors du chargement des produits');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (values: Omit<Product, 'id'>) => {
    try {
      setIsLoading(true);
      console.log('Valeurs soumises:', values);

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          name: values.name,
          description: values.description,
          category: values.category,
          cost: values.cost,
          unit: values.unit,
          reference: values.reference,
          sellingPrice: values.sellingPrice,
        });
        message.success('Produit mis à jour avec succès');
      } else {
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
      }
      
      await loadProducts();
      setIsFormVisible(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      message.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    router.push(`/products/edit/${product.id}`);
  };

  const handleDelete = async (productId: string) => {
    try {
      setIsLoading(true);
      await productService.deleteProduct(productId);
      message.success('Produit supprimé avec succès');
      loadProducts();
    } catch (error) {
      message.error('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldEdit = async (productId: string, field: string, value: any) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      await productService.updateProduct(productId, { ...product, [field]: value });
      loadProducts();
    }
  };

  const handleImport = (importedProducts: any[]) => {
    setProducts(importedProducts);
    // Ici vous pouvez ajouter la logique pour sauvegarder les produits
    console.log('Produits importés:', importedProducts);
  };

  const handleExportProducts = async () => {
    try {
      const response = await fetch('/api/products/export', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'exportation des produits');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success('Produits exportés avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      message.error('Échec de l\'exportation des produits');
    }
  };

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (_: any, record: Product) => (
        record.category === 'MATERIAL' ? (
          <Typography.Text
            editable={{
              onChange: (value) => handleFieldEdit(record.id, 'reference', value),
              tooltip: 'Cliquer pour modifier',
            }}
          >
            {record.reference || '-'}
          </Typography.Text>
        ) : null
      ),
    },
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xls,.xlsx',
    customRequest: async ({ file, onSuccess, onError }: any) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/products/import', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors de l\'importation');
        }

        message.success(result.message);
        onSuccess(result);
        
        // Rafraîchir la liste des produits
        loadProducts();
        
      } catch (error) {
        console.error('Erreur upload:', error);
        message.error('Erreur lors de l\'importation du fichier');
        onError(error);
      }
    },
    onChange(info: any) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} importé avec succès.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} échec de l'importation.`);
      }
    },
  };

  const filteredProducts = products.filter(product => 
    (searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.reference && product.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) && 
    (categoryFilter === null || product.category === categoryFilter)
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produits</h1>
        <div>
          <Button 
            type="primary" 
            onClick={() => router.push('/products/new')}
            className="mb-4 mr-2"
            loading={isLoading}
          >
            Nouveau Produit
          </Button>
          
          <Button 
            onClick={handleExportProducts}
            className="mb-4"
          >
            Exporter les produits
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Rechercher un produit..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
          allowClear
        />
        
        <div className="flex gap-2">
          <Button 
            type={categoryFilter === null ? "primary" : "default"}
            onClick={() => setCategoryFilter(null)}
          >
            Tous
          </Button>
          <Button 
            type={categoryFilter === "MATERIAL" ? "primary" : "default"}
            onClick={() => setCategoryFilter("MATERIAL")}
          >
            Matériaux
          </Button>
          <Button 
            type={categoryFilter === "SERVICE" ? "primary" : "default"}
            onClick={() => setCategoryFilter("SERVICE")}
          >
            Services
          </Button>
        </div>
      </div>

      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Cliquez ou déposez un fichier Excel ici</p>
        <p className="ant-upload-hint">
          Seuls les fichiers Excel (.xls, .xlsx) sont acceptés. 
          Téléchargez le modèle pour voir le format requis.
        </p>
      </Dragger>
      
      <ProductList
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />
    </div>
  );
};

export default ProductsPage; 
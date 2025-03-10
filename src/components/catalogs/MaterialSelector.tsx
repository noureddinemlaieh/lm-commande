import React, { useState } from 'react';
import { List, Button, Input, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Product } from '@/types/Product';

interface MaterialSelectorProps {
  products: Product[];
  onSelect: (material: Product) => void;
  loading?: boolean;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  products,
  onSelect,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrer les matériaux en fonction du terme de recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.reference && product.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Rechercher un matériau..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <List
            dataSource={filteredProducts}
            renderItem={material => (
              <List.Item
                key={material.id}
                actions={[
                  <Button 
                    key="select" 
                    type="primary" 
                    onClick={() => onSelect(material)}
                  >
                    Sélectionner
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={material.name}
                  description={
                    <div>
                      <div>Référence: {material.reference || 'N/A'}</div>
                      <div>Prix: {`${material.sellingPrice.toFixed(2)}`.replace('.', ',')} €</div>
                      <div>Unité: {material.unit}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              hideOnSinglePage: true,
              showSizeChanger: false
            }}
            locale={{
              emptyText: <Empty description="Aucun matériau trouvé" />
            }}
          />
        </div>
      )}
    </>
  );
};

export default MaterialSelector; 
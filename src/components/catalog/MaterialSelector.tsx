import React, { useState, useEffect } from 'react';
import { Modal, Input, Table, Button, message, Form, InputNumber } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { Product } from '@/types/Product';
import { productService } from '@/services/productService';

interface MaterialProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (material: Product) => void;
}

const Material: React.FC<MaterialProps> = ({
  visible,
  onCancel,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Product | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Charger les matériaux à chaque ouverture de la modale
  useEffect(() => {
    if (visible) {
      loadMaterials();
    }
  }, [visible]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const products = await productService.getAllProducts();
      // Filtrer pour ne garder que les matériaux
      const materialProducts = products.filter(p => p.category === 'MATERIAL');
      setMaterials(materialProducts);
    } catch (error) {
      console.error('Erreur lors du chargement des matériaux:', error);
      message.error('Erreur lors du chargement des matériaux');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (material.reference && 
       material.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      render: (text: string) => text || '-',
      width: '15%',
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: '65%',
    },
    {
      title: 'Prix',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => `${cost.toFixed(2)} €`,
      width: '15%',
    },
    {
      title: 'Unité',
      dataIndex: 'unit',
      key: 'unit',
      width: '10%',
    },
  ];

  const rowSelection = {
    type: 'radio' as const,
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Product[]) => {
      setSelectedRowKeys(selectedKeys as string[]);
      setSelectedMaterial(selectedRows[0] || null);
    },
  };

  const handleSelect = () => {
    if (selectedMaterial) {
      onSelect(selectedMaterial);
      setSelectedRowKeys([]);
      setSelectedMaterial(null);
      setSearchTerm('');
    } else {
      message.warning('Veuillez sélectionner un matériau');
    }
  };

  const handleCreateMaterial = () => {
    setIsCreateModalVisible(true);
    form.setFieldsValue({
      name: searchTerm,
      description: '',
      reference: '',
      unit: '',
      buyingPrice: 0,
      sellingPrice: 0,
    });
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Convertir explicitement les valeurs numériques
      const processedValues = {
        ...values,
        buyingPrice: Number(values.buyingPrice),
        sellingPrice: Number(values.sellingPrice)
      };
      
      try {
        setLoading(true);
        
        const newMaterialData = {
          name: processedValues.name,
          description: processedValues.description || '',
          reference: processedValues.reference || '',
          unit: processedValues.unit || '',
          cost: processedValues.buyingPrice,
          sellingPrice: processedValues.sellingPrice,
          category: 'MATERIAL' as const
        };
        
        // Créer le nouveau matériau
        const newMaterial = await productService.createProduct(newMaterialData);
        
        // Ajouter le nouveau matériau à la liste
        setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
        
        // Sélectionner automatiquement le nouveau matériau
        setSelectedRowKeys([newMaterial.id]);
        setSelectedMaterial(newMaterial);
        
        // Fermer la modale de création
        setIsCreateModalVisible(false);
        
        // Afficher un message de succès
        message.success('Matériau créé avec succès');
        
      } catch (error) {
        console.error('Erreur lors de la création du matériau:', error);
        message.error('Erreur lors de la création du matériau');
      } finally {
        setLoading(false);
      }
    } catch (validationError) {
      console.error('Erreur de validation du formulaire:', validationError);
    }
  };

  return (
    <>
      <Modal
        title="Sélectionner un matériau"
        open={visible}
        onCancel={() => {
          setSelectedRowKeys([]);
          setSelectedMaterial(null);
          setSearchTerm('');
          onCancel();
        }}
        width={800}
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Annuler
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={handleSelect}
            disabled={!selectedMaterial}
          >
            Sélectionner
          </Button>,
        ]}
      >
        <div className="mb-4">
          <Input
            placeholder="Rechercher un matériau..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
          />
        </div>

        {filteredMaterials.length === 0 && searchTerm && !loading ? (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleCreateMaterial();
              }}
              style={{ color: '#1890ff' }}
            >
              Créer le matériau "{searchTerm}"
            </a>
          </div>
        ) : (
          <Table
            rowKey="id"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredMaterials}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ y: 400 }}
            locale={{
              emptyText: searchTerm ? (
                <div style={{ padding: '16px 0' }}>
                  <p>Aucun résultat trouvé</p>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCreateMaterial();
                    }}
                  >
                    Créer le matériau "{searchTerm}"
                  </a>
                </div>
              ) : 'Aucun matériau'
            }}
          />
        )}
      </Modal>

      <Modal
        title="Créer un matériau"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={handleCreateSubmit}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
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
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="reference"
            label="Référence"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unité"
          >
            <Input placeholder="ex: kg, m, pièce, etc." />
          </Form.Item>

          <Form.Item
            name="buyingPrice"
            label="Prix d'achat"
            rules={[{ required: true, message: 'Le prix d\'achat est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>

          <Form.Item
            name="sellingPrice"
            label="Prix de vente"
            rules={[{ required: true, message: 'Le prix de vente est requis' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              formatter={value => {
                if (value === null || value === undefined) return '0,00 €';
                return `${value.toString().replace('.', ',')} €`;
              }}
              parser={(value: string | undefined) => {
                if (!value) return 0;
                const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
                return cleanValue ? parseFloat(cleanValue) : 0;
              }}
              stringMode={true}
              keyboard={true}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Material; 
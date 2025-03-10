'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, InputNumber, Select, Table, Divider, Modal, Form, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

export interface InvoiceSection {
  id: string;
  name: string;
  subTotal: number;
  items: InvoiceItem[];
  isDirectMode?: boolean;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tva: number;
  amount: number;
  materials?: Material[];
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
  tva: number;
  billable?: boolean;
}

export interface InvoiceEditorProps {
  sections: InvoiceSection[];
  onSectionsChange: (sections: InvoiceSection[]) => void;
  clientId: string | null;
  autoliquidation?: boolean;
  initialUseSections?: boolean;
}

export default function InvoiceEditor({ sections, onSectionsChange, clientId, autoliquidation = false, initialUseSections = false }: InvoiceEditorProps) {
  const [useSections, setUseSections] = useState(initialUseSections);
  const [editingSection, setEditingSection] = useState<InvoiceSection | null>(null);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [sectionForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [materialForm] = Form.useForm();

  useEffect(() => {
    console.log("Sections reçues par InvoiceEditor:", JSON.stringify(sections, null, 2));
    console.log("Mode initial avec sections:", initialUseSections);
    
    if (sections.length > 0) {
      const firstSection = sections[0];
      console.log("Première section:", firstSection);
      console.log("Items de la première section:", firstSection.items);
      
      if (initialUseSections !== undefined) {
        setUseSections(initialUseSections);
      } else {
        setUseSections(!firstSection.isDirectMode);
      }
    }
  }, [sections, initialUseSections]);

  useEffect(() => {
    if (sections.length > 0) {
      return;
    }
    
    if (!useSections) {
      onSectionsChange([{
        id: 'direct-items',
        name: '',
        subTotal: 0,
        items: [],
        isDirectMode: true
      }]);
    }
  }, [sections, useSections, onSectionsChange]);

  const handleUseSectionsChange = useCallback((checked: boolean) => {
    setUseSections(checked);
    
    if (checked) {
      // Passer en mode sections
      if (sections.length === 1 && sections[0].isDirectMode) {
        const items = [...sections[0].items];
        onSectionsChange([
          {
            id: uuidv4(),
            name: 'Section 1',
            subTotal: sections[0].subTotal,
            items: items
          }
        ]);
      } else if (sections.length === 0) {
        onSectionsChange([
          {
            id: uuidv4(),
            name: 'Section 1',
            subTotal: 0,
            items: []
          }
        ]);
      }
    } else {
      // Passer en mode direct
      const allItems = sections.flatMap(section => section.items);
      const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
      
      onSectionsChange([
        {
          id: 'direct-items',
          name: '',
          subTotal: totalAmount,
          items: allItems,
          isDirectMode: true
        }
      ]);
    }
  }, [sections, onSectionsChange]);

  const handleAddDirectItem = () => {
    setEditingItem({
      id: uuidv4(),
      name: '',
      description: '',
      quantity: 1,
      unit: 'unité',
      unitPrice: 0,
      tva: 20,
      amount: 0,
      materials: []
    });
    setCurrentSectionIndex(0);
    setShowItemModal(true);
  };

  const handleAddSection = () => {
    setEditingSection({
      id: uuidv4(),
      name: '',
      subTotal: 0,
      items: []
    });
    setShowSectionModal(true);
  };

  const handleEditSection = (section: any, index: number) => {
    setEditingSection({ ...section });
    setCurrentSectionIndex(index);
    setShowSectionModal(true);
    sectionForm.setFieldsValue({
      name: section.name
    });
  };

  const handleDeleteSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    onSectionsChange(newSections);
  };

  const handleSaveSection = (values: any) => {
    const newSection = {
      ...editingSection,
      name: values.name
    };
    
    const newSections = [...sections];
    if (currentSectionIndex !== null) {
      newSections[currentSectionIndex] = newSection;
    } else {
      newSections.push(newSection);
    }
    
    onSectionsChange(newSections);
    setShowSectionModal(false);
    setEditingSection(null);
    setCurrentSectionIndex(null);
    sectionForm.resetFields();
  };

  const handleAddItem = (sectionIndex: number) => {
    setEditingItem({
      id: uuidv4(),
      name: '',
      description: '',
      quantity: 1,
      unit: 'unité',
      unitPrice: 0,
      tva: autoliquidation ? 0 : 20,
      amount: 0,
      materials: []
    });
    setCurrentSectionIndex(sectionIndex);
    setShowItemModal(true);
  };

  const handleEditItem = (item: any, sectionIndex: number, itemIndex: number) => {
    setEditingItem({ ...item });
    setCurrentSectionIndex(sectionIndex);
    setCurrentItemIndex(itemIndex);
    setShowItemModal(true);
    itemForm.setFieldsValue({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      tva: autoliquidation ? 0 : item.tva
    });
  };

  const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items.splice(itemIndex, 1);
    
    const subTotal = newSections[sectionIndex].items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice), 
      0
    );
    newSections[sectionIndex].subTotal = subTotal;
    
    onSectionsChange(newSections);
  };

  const handleSaveItem = (values: any) => {
    if (autoliquidation) {
      values.tva = 0;
    }
    
    const amount = values.quantity * values.unitPrice;
    const newItem = {
      ...editingItem,
      ...values,
      amount
    };
    
    const newSections = [...sections];
    if (currentSectionIndex !== null) {
      if (currentItemIndex !== null) {
        newSections[currentSectionIndex].items[currentItemIndex] = newItem;
      } else {
        newSections[currentSectionIndex].items.push(newItem);
      }
      
      const subTotal = newSections[currentSectionIndex].items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice), 
        0
      );
      newSections[currentSectionIndex].subTotal = subTotal;
    }
    
    onSectionsChange(newSections);
    setShowItemModal(false);
    setEditingItem(null);
    setCurrentItemIndex(null);
    itemForm.resetFields();
  };

  const handleAddMaterial = (sectionIndex: number, itemIndex: number) => {
    setEditingMaterial({
      id: uuidv4(),
      name: '',
      quantity: 1,
      price: 0,
      unit: 'unité',
      reference: '',
      tva: 20
    });
    setCurrentSectionIndex(sectionIndex);
    setCurrentItemIndex(itemIndex);
    setShowMaterialModal(true);
  };

  const handleEditMaterial = (material: any, sectionIndex: number, itemIndex: number, materialIndex: number) => {
    setEditingMaterial({ ...material });
    setCurrentSectionIndex(sectionIndex);
    setCurrentItemIndex(itemIndex);
    setShowMaterialModal(true);
    materialForm.setFieldsValue({
      name: material.name,
      quantity: material.quantity,
      price: material.price,
      unit: material.unit,
      reference: material.reference,
      tva: material.tva
    });
  };

  const handleDeleteMaterial = (sectionIndex: number, itemIndex: number, materialIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items[itemIndex].materials.splice(materialIndex, 1);
    onSectionsChange(newSections);
  };

  const handleSaveMaterial = (values: any) => {
    const newMaterial = {
      ...editingMaterial,
      name: values.name,
      quantity: values.quantity,
      price: values.price,
      unit: values.unit,
      reference: values.reference,
      tva: values.tva
    };
    
    const newSections = [...sections];
    if (currentSectionIndex !== null && currentItemIndex !== null) {
      if (!newSections[currentSectionIndex].items[currentItemIndex].materials) {
        newSections[currentSectionIndex].items[currentItemIndex].materials = [];
      }
      
      newSections[currentSectionIndex].items[currentItemIndex].materials.push(newMaterial);
    }
    
    onSectionsChange(newSections);
    setShowMaterialModal(false);
    setEditingMaterial(null);
    materialForm.resetFields();
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Contenu de la facture</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Utiliser des sections:</span>
            <Switch checked={useSections} onChange={handleUseSectionsChange} />
          </div>
          {useSections ? (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddSection}
            >
              Ajouter une section
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddDirectItem}
            >
              Ajouter une ligne
            </Button>
          )}
        </div>
      </div>

      {useSections ? (
        sections.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune section ajoutée</p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddSection}
            >
              Ajouter une section
            </Button>
          </Card>
        ) : (
          sections.map((section, sectionIndex) => (
            <Card 
              key={section.id} 
              title={section.name}
              className="mb-4"
              extra={
                <div className="flex gap-2">
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => handleEditSection(section, sectionIndex)}
                  />
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDeleteSection(sectionIndex)}
                  />
                </div>
              }
            >
              <Table
                dataSource={section.items}
                rowKey="id"
                pagination={false}
                className="mb-4"
                columns={[
                  {
                    title: 'Nom',
                    dataIndex: 'name',
                    key: 'name',
                    width: '25%',
                  },
                  {
                    title: 'Quantité',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: '10%',
                    render: (text) => text.toFixed(2)
                  },
                  {
                    title: 'Unité',
                    dataIndex: 'unit',
                    key: 'unit',
                    width: '10%',
                  },
                  {
                    title: 'Prix unitaire',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    width: '15%',
                    render: (text) => `${text.toFixed(2)} €`
                  },
                  {
                    title: 'TVA',
                    dataIndex: 'tva',
                    key: 'tva',
                    width: '10%',
                    render: (text) => `${text}%`
                  },
                  {
                    title: 'Total HT',
                    key: 'amount',
                    width: '15%',
                    render: (_, record: InvoiceItem) => `${(record.quantity * record.unitPrice).toFixed(2)} €`
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    width: '15%',
                    render: (_, record, itemIndex) => (
                      <div className="flex gap-2">
                        <Button 
                          icon={<PlusOutlined />} 
                          size="small"
                          onClick={() => handleAddMaterial(sectionIndex, itemIndex)}
                        >
                          Matériau
                        </Button>
                        <Button 
                          icon={<EditOutlined />} 
                          size="small"
                          onClick={() => handleEditItem(record, sectionIndex, itemIndex)}
                        />
                        <Button 
                          danger 
                          icon={<DeleteOutlined />} 
                          size="small"
                          onClick={() => handleDeleteItem(sectionIndex, itemIndex)}
                        />
                      </div>
                    )
                  }
                ]}
                expandable={{
                  expandedRowRender: (record, itemIndex) => (
                    <div>
                      <h4 className="font-medium mb-2">Matériaux</h4>
                      {record.materials && record.materials.length > 0 ? (
                        <Table
                          dataSource={record.materials}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: 'Nom',
                              dataIndex: 'name',
                              key: 'name',
                            },
                            {
                              title: 'Référence',
                              dataIndex: 'reference',
                              key: 'reference',
                            },
                            {
                              title: 'Quantité',
                              dataIndex: 'quantity',
                              key: 'quantity',
                              render: (text) => text.toFixed(2)
                            },
                            {
                              title: 'Unité',
                              dataIndex: 'unit',
                              key: 'unit',
                            },
                            {
                              title: 'Prix',
                              dataIndex: 'price',
                              key: 'price',
                              render: (text) => `${text.toFixed(2)} €`
                            },
                            {
                              title: 'TVA',
                              dataIndex: 'tva',
                              key: 'tva',
                              render: (text) => `${text}%`
                            },
                            {
                              title: 'Actions',
                              key: 'actions',
                              render: (_, material, materialIndex) => (
                                <div className="flex gap-2">
                                  <Button 
                                    icon={<EditOutlined />} 
                                    size="small"
                                    onClick={() => handleEditMaterial(material, sectionIndex, itemIndex, materialIndex)}
                                  />
                                  <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    size="small"
                                    onClick={() => handleDeleteMaterial(sectionIndex, itemIndex, materialIndex)}
                                  />
                                </div>
                              )
                            }
                          ]}
                        />
                      ) : (
                        <p className="text-gray-500">Aucun matériau</p>
                      )}
                    </div>
                  )
                }}
              />
              
              <div className="flex justify-between items-center">
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  onClick={() => handleAddItem(sectionIndex)}
                >
                  Ajouter un élément
                </Button>
                <div className="text-right">
                  <p className="font-medium">Sous-total: {section.subTotal.toFixed(2)} €</p>
                </div>
              </div>
            </Card>
          ))
        )
      ) : (
        <Card className="border-0 shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-center">Qté</th>
                  <th className="p-2 text-center">Unité</th>
                  <th className="p-2 text-right">Prix unitaire</th>
                  <th className="p-2 text-center">TVA</th>
                  <th className="p-2 text-right">Total HT</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(sections[0]?.items || []).map((item, index) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      <div>{item.name}</div>
                      {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center">{item.unit}</td>
                    <td className="p-2 text-right">{item.unitPrice.toFixed(2)} €</td>
                    <td className="p-2 text-center">{item.tva}%</td>
                    <td className="p-2 text-right">{item.amount.toFixed(2)} €</td>
                    <td className="p-2 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button 
                          icon={<EditOutlined />} 
                          size="small"
                          onClick={() => handleEditItem(item, 0, index)}
                        />
                        <Button 
                          icon={<DeleteOutlined />} 
                          size="small" 
                          danger
                          onClick={() => handleDeleteItem(0, index)}
                        />
                        <Button 
                          size="small"
                          onClick={() => handleAddMaterial(0, index)}
                        >
                          + Matériau
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={handleAddDirectItem}
              block
            >
              Ajouter une ligne
            </Button>
          </div>
        </Card>
      )}

      <Modal
        title={currentSectionIndex !== null ? "Modifier la section" : "Ajouter une section"}
        open={showSectionModal}
        onCancel={() => {
          setShowSectionModal(false);
          setEditingSection(null);
          setCurrentSectionIndex(null);
          sectionForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={sectionForm}
          layout="vertical"
          onFinish={handleSaveSection}
        >
          <Form.Item
            name="name"
            label="Nom de la section"
            rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
          >
            <Input />
          </Form.Item>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setShowSectionModal(false);
              setEditingSection(null);
              setCurrentSectionIndex(null);
              sectionForm.resetFields();
            }}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>
      
      <Modal
        title={currentItemIndex !== null ? "Modifier l'élément" : "Ajouter un élément"}
        open={showItemModal}
        onCancel={() => {
          setShowItemModal(false);
          setEditingItem(null);
          setCurrentItemIndex(null);
          itemForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={itemForm}
          layout="vertical"
          onFinish={handleSaveItem}
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="quantity"
              label="Quantité"
              rules={[{ required: true, message: 'Veuillez entrer une quantité' }]}
            >
              <InputNumber min={0} step={0.01} className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="unit"
              label="Unité"
              rules={[{ required: true, message: 'Veuillez entrer une unité' }]}
            >
              <Input />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="unitPrice"
              label="Prix unitaire"
              rules={[{ required: true, message: 'Veuillez entrer un prix' }]}
            >
              <InputNumber min={0} step={0.01} className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="tva"
              label="TVA (%)"
              rules={[{ required: true, message: 'Veuillez saisir le taux de TVA' }]}
              initialValue={autoliquidation ? 0 : 20}
            >
              {autoliquidation ? (
                <Select disabled defaultValue={0}>
                  <Select.Option value={0}>0%</Select.Option>
                </Select>
              ) : (
                <Select>
                  <Select.Option value={0}>0%</Select.Option>
                  <Select.Option value={5.5}>5.5%</Select.Option>
                  <Select.Option value={10}>10%</Select.Option>
                  <Select.Option value={20}>20%</Select.Option>
                </Select>
              )}
            </Form.Item>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setShowItemModal(false);
              setEditingItem(null);
              setCurrentItemIndex(null);
              itemForm.resetFields();
            }}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>
      
      <Modal
        title="Ajouter un matériau"
        open={showMaterialModal}
        onCancel={() => {
          setShowMaterialModal(false);
          setEditingMaterial(null);
          materialForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={materialForm}
          layout="vertical"
          onFinish={handleSaveMaterial}
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="reference"
            label="Référence"
          >
            <Input />
          </Form.Item>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="quantity"
              label="Quantité"
              rules={[{ required: true, message: 'Veuillez entrer une quantité' }]}
            >
              <InputNumber min={0} step={0.01} className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="unit"
              label="Unité"
              rules={[{ required: true, message: 'Veuillez entrer une unité' }]}
            >
              <Input />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Prix"
              rules={[{ required: true, message: 'Veuillez entrer un prix' }]}
            >
              <InputNumber min={0} step={0.01} className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="tva"
              label="TVA (%)"
              rules={[{ required: true, message: 'Veuillez entrer un taux de TVA' }]}
            >
              <InputNumber min={0} max={100} className="w-full" />
            </Form.Item>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button onClick={() => {
              setShowMaterialModal(false);
              setEditingMaterial(null);
              materialForm.resetFields();
            }}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              Enregistrer
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
} 
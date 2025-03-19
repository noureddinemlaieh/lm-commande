'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Form, Space, Spin, message, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import DevisSection from '@/components/Devis/DevisSection';
import { Service as CatalogService, Material as CatalogMaterial } from '@/types/Catalog';

interface Material extends CatalogMaterial {
  isExpanded?: boolean;
  toChoose?: boolean;
  tva?: number;
}

interface TemplateService extends Omit<CatalogService, 'materials'> {
  showInDevis: boolean;
  materialsTotal: number;
  subTotal: number;
  materials: Material[];
  isExpanded: boolean;
  tva?: number;
  quantity?: number;
}

interface Section {
  id?: string;
  name: string;
  services: TemplateService[];
  isExpanded?: boolean;
  materialsTotal?: number;
  subTotal?: number;
}

interface DevisTemplate {
  id?: string;
  name: string;
  description: string;
  sections: Section[];
}

interface Catalog {
  id: string;
  name: string;
}

export default function EditDevisTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(!isNew);
  const [template, setTemplate] = useState<DevisTemplate>({
    name: '',
    description: '',
    sections: []
  });
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');

  useEffect(() => {
    if (!isNew) {
      loadTemplate();
    }
    loadCatalogs();
  }, [params.id]);

  useEffect(() => {
    if (selectedCatalog) {
      loadCatalogServices(selectedCatalog);
      form.setFieldValue('catalogId', selectedCatalog);
    } else {
      setCatalogServices([]);
    }
  }, [selectedCatalog]);

  const loadCatalogs = async () => {
    try {
      const response = await fetch('/api/catalogs');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des catalogues');
      }
      const data = await response.json();
      setCatalogs(data);

      if (data.length > 0 && !selectedCatalog) {
        setSelectedCatalog(data[0].id);
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les catalogues');
    }
  };

  const loadTemplate = async () => {
    try {
      const response = await fetch(`/api/devis-templates/${params.id}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du modèle');
      }
      const data = await response.json();
      setTemplate(data);
      form.setFieldsValue(data);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger le modèle de devis');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogServices = async (catalogId: string) => {
    try {
      console.log('Chargement des services pour le catalogue:', catalogId);
      const response = await fetch(`/api/catalogs/${catalogId}/prestations`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des prestations');
      }
      const data = await response.json();
      console.log('Services chargés:', data);
      
      // Transformer les données pour correspondre au format attendu
      const services = data.categories.flatMap(category => 
        category.services.map(service => ({
          ...service,
          categoryId: category.id,
          categoryName: category.name
        }))
      );
      
      console.log('Services transformés:', services);
      setCatalogServices(services);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les prestations');
    }
  };

  const onFinish = async (values: DevisTemplate) => {
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/devis-templates' : `/api/devis-templates/${params.id}`;
      
      // S'assurer que les sections sont incluses dans les données envoyées
      const dataToSend = {
        ...values,
        sections: template.sections.map(section => ({
          name: section.name,
          services: section.services.map(service => ({
            name: service.name,
            description: service.description || '',
            price: service.price || 0,
            quantity: service.quantity || 1,
            unit: service.unit || 'm²',
            tva: service.tva || 20,
            materials: service.materials.map(material => ({
              name: material.name,
              price: material.price || 0,
              quantity: material.quantity || 1,
              unit: material.unit || 'm²',
              tva: material.tva || 20,
              reference: material.reference || null
            }))
          }))
        }))
      };
      
      console.log('Données envoyées au serveur:', JSON.stringify(dataToSend, null, 2));
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur lors de la sauvegarde: ${JSON.stringify(errorData)}`);
      }

      message.success('Modèle sauvegardé avec succès');
      router.push('/devis-templates');
    } catch (error) {
      console.error('Erreur complète:', error);
      message.error('Erreur lors de la sauvegarde du modèle');
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const addSection = () => {
    const newSection = {
      id: `new-section-${Date.now()}`,
      name: 'Nouvelle section',
      services: [],
      isExpanded: true
    };
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setExpandedSections(prev => [...prev, newSection.id]);
  };

  const removeSection = (sectionIndex: number) => {
    const newSections = template.sections.filter((_, index) => index !== sectionIndex);
    setTemplate({ ...template, sections: newSections });
  };

  const handleAddService = (sectionId: string, serviceId: string) => {
    console.log('Ajout du service:', serviceId, 'à la section:', sectionId);
    const selectedService = catalogServices.find(s => s.id === serviceId);
    console.log('Service trouvé:', selectedService);

    if (selectedService) {
      const newService: TemplateService = {
        ...selectedService,
        showInDevis: true,
        materialsTotal: selectedService.materials?.reduce((total, material) => 
          total + (material.price * material.quantity), 0) || 0,
        subTotal: selectedService.price,
        materials: selectedService.materials?.map(material => ({
          id: material.id,
          name: material.name,
          serviceId: selectedService.id,
          isExpanded: false,
          unit: material.unit || 'u',
          quantity: material.quantity || 1,
          price: material.price || 0,
          reference: material.reference
        })) || [],
        isExpanded: false
      };

      console.log('Nouveau service à ajouter avec matériaux:', newService);

      const updatedSections = template.sections.map(section => {
        if (section.id === sectionId) {
          const updatedServices = [...section.services, newService];
          const materialsTotal = updatedServices.reduce((total, service) => 
            total + service.materialsTotal, 0);
          const subTotal = updatedServices.reduce((total, service) => 
            total + (service.price * (service.quantity || 1)), 0);

          return {
            ...section,
            services: updatedServices,
            materialsTotal,
            subTotal
          };
        }
        return section;
      });

      setTemplate(prev => ({
        ...prev,
        sections: updatedSections
      }));

      form.setFieldsValue({
        sections: updatedSections
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modèle de devis</h1>
        <Space>
          <Button onClick={() => router.push('/devis-templates')}>
            Annuler
          </Button>
          <Button type="primary" onClick={form.submit}>
            {isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={template}
        className="space-y-4"
      >
        <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
          <Form.Item
            name="name"
            label="Nom du modèle"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'La description est requise' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="catalogId"
            label="Catalogue"
            rules={[{ required: true, message: 'Le catalogue est requis' }]}
          >
            <Select
              placeholder="Sélectionner un catalogue"
              value={selectedCatalog}
              onChange={(value) => setSelectedCatalog(value)}
              options={catalogs.map(catalog => ({
                label: catalog.name,
                value: catalog.id
              }))}
              className="w-full"
            />
          </Form.Item>
        </div>

        {template.sections.map((section, sectionIndex) => (
          <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="flex items-center p-4 cursor-pointer bg-gray-50"
              onClick={() => toggleSection(section.id!)}
            >
              {expandedSections.includes(section.id!) ? <DownOutlined /> : <RightOutlined />}
              <Input 
                className="ml-2 flex-grow"
                placeholder="Nom de la section"
                value={section.name}
                onChange={(e) => {
                  const newSections = [...template.sections];
                  newSections[sectionIndex].name = e.target.value;
                  setTemplate({ ...template, sections: newSections });
                }}
              />
              <div className="flex items-center space-x-4 ml-4">
                <span>Matériaux : {section.materialsTotal?.toFixed(2)} €</span>
                <span>Sous total : {section.subTotal?.toFixed(2)} €</span>
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(sectionIndex);
                  }}
                />
              </div>
            </div>

            {expandedSections.includes(section.id!) && (
              <div className="p-4">
                <DevisSection
                  key={`${section.id}-${selectedCatalog}`}
                  sectionName={section.name}
                  catalogServices={catalogServices}
                  onAddService={(serviceId) => handleAddService(section.id!, serviceId)}
                  services={section.services}
                  onUpdateService={(serviceIndex, updatedService) => {
                    const newSections = [...template.sections];
                    newSections[sectionIndex].services[serviceIndex] = updatedService;
                    setTemplate({ ...template, sections: newSections });
                  }}
                  onDeleteService={(serviceIndex) => {
                    const newSections = [...template.sections];
                    newSections[sectionIndex].services = newSections[sectionIndex].services.filter(
                      (_, index) => index !== serviceIndex
                    );
                    setTemplate({ ...template, sections: newSections });
                  }}
                />
              </div>
            )}
          </div>
        ))}

        <Button
          type="dashed"
          onClick={addSection}
          icon={<PlusOutlined />}
          className="w-full mt-4"
        >
          Ajouter une section
        </Button>
      </Form>
    </div>
  );
} 
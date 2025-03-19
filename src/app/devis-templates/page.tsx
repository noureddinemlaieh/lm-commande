'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Spin, message, Modal, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CopyOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import './devis-templates.css';

interface DevisTemplate {
  id: string;
  name: string;
  description: string;
  sections: any[];
  createdAt: string;
  updatedAt: string;
}

export default function DevisTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DevisTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<DevisTemplate | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/devis-templates');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des modèles');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les modèles de devis');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: DevisTemplate) => {
    try {
      const response = await fetch(`/api/devis-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      message.success('Modèle supprimé avec succès');
      loadTemplates();
      setDeleteModalVisible(false);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de supprimer le modèle');
    }
  };

  const handleDuplicate = async (template: DevisTemplate) => {
    try {
      const response = await fetch(`/api/devis-templates/${template.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la duplication');
      }

      message.success('Modèle dupliqué avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de dupliquer le modèle');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTemplateActions = (template: DevisTemplate): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Modifier',
      onClick: () => router.push(`/devis-templates/${template.id}`)
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Dupliquer',
      onClick: () => handleDuplicate(template)
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Supprimer',
      danger: true,
      onClick: () => {
        setTemplateToDelete(template);
        setDeleteModalVisible(true);
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modèles de devis</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/devis-templates/new')}
        >
          Nouveau modèle
        </Button>
      </div>

      <div className="mb-6">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Rechercher un modèle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              title={
                <div className="flex items-center justify-between">
                  <span>{template.name}</span>
                  <Dropdown
                    menu={{ items: getTemplateActions(template) }}
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                </div>
              }
              className="h-full"
            >
              <p className="text-gray-600">{template.description}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  {template.sections.length} section(s)
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucun modèle trouvé</p>
          <Link href="/devis-templates/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Créer un modèle
            </Button>
          </Link>
        </div>
      )}

      <Modal
        title="Confirmer la suppression"
        open={deleteModalVisible}
        onOk={() => templateToDelete && handleDelete(templateToDelete)}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer le modèle "{templateToDelete?.name}" ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
} 
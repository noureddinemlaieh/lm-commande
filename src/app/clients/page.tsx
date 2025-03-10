'use client';

import { useState, useEffect } from 'react';
import { Table, Button as AntButton, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/Client';
import { ConfirmationModal } from '@/components/ui';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean; id?: string; name?: string}>({
    isOpen: false
  });
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Erreur lors du chargement des clients');
      const data = await response.json();
      setClients(data);
    } catch (_error) {
      message.error("Impossible de charger les clients");
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    
    try {
      const response = await fetch(`/api/clients/${deleteModal.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      message.success('Client supprimé avec succès');
      loadClients();
    } catch (_error) {
      message.error("Impossible de supprimer le client");
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Prescripteur',
      key: 'prescriber',
      render: (record: Client) => record.prescriber?.nom || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Client) => (
        <Space>
          <AntButton 
            icon={<EditOutlined />}
            onClick={() => router.push(`/clients/${record.id}/edit`)}
          >
            Modifier
          </AntButton>
          <AntButton 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id, record.name)}
          >
            Supprimer
          </AntButton>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <AntButton 
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/clients/new')}
        >
          Nouveau Client
        </AntButton>
      </div>

      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le client "${deleteModal.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
} 
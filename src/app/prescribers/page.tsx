'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Prescriber } from '@/types/Prescriber';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export default function PrescribersPage() {
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean; id?: string; name?: string}>({
    isOpen: false
  });
  const router = useRouter();

  useEffect(() => {
    loadPrescribers();
  }, []);

  const loadPrescribers = async () => {
    try {
      const response = await fetch('/api/prescribers');
      if (!response.ok) throw new Error('Erreur lors du chargement des prescripteurs');
      const data = await response.json();
      setPrescribers(data);
    } catch (error) {
      message.error("Impossible de charger les prescripteurs");
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
      const response = await fetch(`/api/prescribers/${deleteModal.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      message.success('Prescripteur supprimé avec succès');
      loadPrescribers();
    } catch (error) {
      message.error("Impossible de supprimer le prescripteur");
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: 'Email',
      dataIndex: 'mail1',
      key: 'mail1',
    },
    {
      title: 'Téléphone',
      dataIndex: 'tel1',
      key: 'tel1',
    },
    {
      title: 'Ville',
      dataIndex: 'ville',
      key: 'ville',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Prescriber) => (
        <Space>
          <Button 
            icon={<EditOutlined />}
            onClick={() => router.push(`/prescribers/${record.id}/edit`)}
          >
            Modifier
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id, record.nom)}
          >
            Supprimer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prescripteurs</h1>
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/prescribers/new')}
        >
          Nouveau Prescripteur
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={prescribers}
        rowKey="id"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le prescripteur "${deleteModal.name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, InputNumber, DatePicker, Input, message, Card, Typography, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text } = Typography;

interface RetentionRelease {
  id: string;
  amount: number;
  releaseDate: string;
  notes?: string;
}

interface RetentionReleaseManagerProps {
  retentionId: string;
  totalAmount: number;
  releases: RetentionRelease[];
  onReleasesChange: (releases: RetentionRelease[]) => void;
  readOnly?: boolean;
}

export default function RetentionReleaseManager({
  retentionId,
  totalAmount,
  releases,
  onReleasesChange,
  readOnly = false
}: RetentionReleaseManagerProps) {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRelease, setEditingRelease] = useState<RetentionRelease | null>(null);
  const [releasedAmount, setReleasedAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(totalAmount);

  // Calculer les montants libérés et restants
  useEffect(() => {
    const released = releases.reduce((sum, release) => sum + release.amount, 0);
    setReleasedAmount(released);
    setRemainingAmount(totalAmount - released);
  }, [releases, totalAmount]);

  const showAddModal = () => {
    setEditingRelease(null);
    form.resetFields();
    form.setFieldsValue({
      amount: remainingAmount,
      releaseDate: dayjs()
    });
    setIsModalVisible(true);
  };

  const showEditModal = (release: RetentionRelease) => {
    setEditingRelease(release);
    form.setFieldsValue({
      amount: release.amount,
      releaseDate: dayjs(release.releaseDate),
      notes: release.notes
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRelease(null);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const newRelease = {
        id: editingRelease ? editingRelease.id : uuidv4(),
        amount: values.amount,
        releaseDate: values.releaseDate.format('YYYY-MM-DD'),
        notes: values.notes
      };

      let updatedReleases;
      if (editingRelease) {
        // Mise à jour d'une libération existante
        updatedReleases = releases.map(release => 
          release.id === editingRelease.id ? newRelease : release
        );
      } else {
        // Ajout d'une nouvelle libération
        updatedReleases = [...releases, newRelease];
      }

      // Vérifier que le total des libérations ne dépasse pas le montant total de la retenue
      const totalReleased = updatedReleases.reduce((sum, release) => sum + release.amount, 0);
      if (totalReleased > totalAmount) {
        message.error('Le total des libérations ne peut pas dépasser le montant de la retenue');
        return;
      }

      onReleasesChange(updatedReleases);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleDelete = (id: string) => {
    const updatedReleases = releases.filter(release => release.id !== id);
    onReleasesChange(updatedReleases);
  };

  const columns = [
    {
      title: 'Date de libération',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Montant libéré',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `${amount.toFixed(2)} €`
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: RetentionRelease) => (
        !readOnly && (
          <div>
            <Button 
              icon={<EditOutlined />} 
              type="text" 
              onClick={() => showEditModal(record)}
              style={{ marginRight: 8 }}
            />
            <Popconfirm
              title="Êtes-vous sûr de vouloir supprimer cette libération?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button icon={<DeleteOutlined />} type="text" danger />
            </Popconfirm>
          </div>
        )
      )
    }
  ];

  return (
    <Card title="Suivi des libérations de retenue" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <Text strong>Montant total de la retenue:</Text>
          <Text style={{ marginLeft: 8 }}>{totalAmount.toFixed(2)} €</Text>
        </div>
        <div>
          <Text strong>Montant libéré:</Text>
          <Text style={{ marginLeft: 8 }}>{releasedAmount.toFixed(2)} €</Text>
          <Text strong style={{ marginLeft: 16 }}>Montant restant:</Text>
          <Text style={{ marginLeft: 8 }}>{remainingAmount.toFixed(2)} €</Text>
          <Tag color={remainingAmount === 0 ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
            {remainingAmount === 0 ? 'LIBÉRÉE' : 'EN COURS'}
          </Tag>
        </div>
      </div>

      <Table
        dataSource={releases}
        columns={readOnly ? columns.filter(col => col.key !== 'actions') : columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'Aucune libération enregistrée' }}
      />

      {!readOnly && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddModal}
          style={{ marginTop: 16 }}
          disabled={remainingAmount <= 0}
        >
          Ajouter une libération
        </Button>
      )}

      <Modal
        title={editingRelease ? 'Modifier la libération' : 'Ajouter une libération'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={editingRelease ? 'Mettre à jour' : 'Ajouter'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="amount"
            label="Montant libéré (€)"
            rules={[
              { required: true, message: 'Veuillez saisir le montant' },
              { 
                validator: (_, value) => {
                  if (value <= 0) {
                    return Promise.reject('Le montant doit être supérieur à 0');
                  }
                  if (!editingRelease && value > remainingAmount) {
                    return Promise.reject(`Le montant ne peut pas dépasser ${remainingAmount.toFixed(2)} €`);
                  }
                  if (editingRelease) {
                    const otherReleasesTotal = releases
                      .filter(r => r.id !== editingRelease.id)
                      .reduce((sum, r) => sum + r.amount, 0);
                    if (value + otherReleasesTotal > totalAmount) {
                      return Promise.reject(`Le total des libérations ne peut pas dépasser ${totalAmount.toFixed(2)} €`);
                    }
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              min={0.01}
              max={editingRelease ? undefined : remainingAmount}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="releaseDate"
            label="Date de libération"
            rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
} 
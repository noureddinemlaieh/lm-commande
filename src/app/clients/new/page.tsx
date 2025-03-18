'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Select, _Spin } from 'antd';
import { useRouter } from 'next/navigation';
import type { Prescriber } from '@/types/Prescriber';

export default function NewClientPage() {
  const [loading, setLoading] = useState(false);
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [loadingPrescribers, setLoadingPrescribers] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPrescribers = async () => {
      try {
        const response = await fetch('/api/prescribers');
        if (!response.ok) throw new Error('Erreur lors du chargement des prescripteurs');
        const data = await response.json();
        setPrescribers(data);
      } catch (_error) {
        message.error("Impossible de charger les prescripteurs");
      } finally {
        setLoadingPrescribers(false);
      }
    };

    loadPrescribers();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Erreur lors de la création du client');

      message.success('Client créé avec succès');
      router.push('/clients');
    } catch (_error) {
      message.error("Erreur lors de la création du client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nouveau Client</h1>
      </div>

      <Card>
        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Nom"
            name="name"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item
            label="Téléphone"
            name="phone"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Société"
            name="company"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Adresse"
            name="address"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Code postal"
            name="postalCode"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Ville"
            name="city"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Pays"
            name="country"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Prescripteur"
            name="prescriberId"
          >
            <Select
              loading={loadingPrescribers}
              placeholder="Sélectionner un prescripteur"
              allowClear
              showSearch
              optionFilterProp="label"
            >
              {prescribers.map(prescriber => (
                <Select.Option 
                  key={prescriber.id} 
                  value={prescriber.id}
                  label={prescriber.nom}
                >
                  {prescriber.nom} {prescriber.contact ? `(${prescriber.contact})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-4">
              <Button onClick={() => router.push('/clients')}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Créer
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 
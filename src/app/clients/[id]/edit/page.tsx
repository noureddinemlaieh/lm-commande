'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Card, message, Select, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types/Client';
import type { Prescriber } from '@/types/Prescriber';

interface ClientFormData {
  name: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  prescriberId?: string;
  notes?: string;
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [loadingPrescribers, setLoadingPrescribers] = useState(true);
  const [form] = Form.useForm();
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientResponse, prescribersResponse] = await Promise.all([
        fetch(`/api/clients/${params.id}`),
        fetch('/api/prescribers')
      ]);
      
      if (!clientResponse.ok) {
        throw new Error("Impossible de charger les données du client");
      }
      
      const clientData = await clientResponse.json();
      setClient(clientData);
      form.setFieldsValue(clientData);
      
      const prescribersData = await prescribersResponse.json();
      setPrescribers(prescribersData);
    } catch (error) {
      message.error("Impossible de charger les données");
      router.push('/clients');
    } finally {
      setLoadingPrescribers(false);
    }
  }, [params.id, form, router, setLoadingPrescribers, setPrescribers, message]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onFinish = async (values: ClientFormData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Erreur lors de la modification du client');

      message.success('Client modifié avec succès');
      router.push('/clients');
    } catch (_error) {
      message.error("Impossible de mettre à jour le client");
    } finally {
      setLoading(false);
    }
  };

  if (!client) {
    return <div className="p-6"><Spin /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Modifier le Client</h1>
      </div>

      <Card>
        <Form
          form={form}
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
                Enregistrer
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 
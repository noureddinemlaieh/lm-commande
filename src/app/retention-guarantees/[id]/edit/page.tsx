'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Button, Form, Input, InputNumber, DatePicker, Select, Row, Col, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import RetentionReleaseManager from '@/components/RetentionReleaseManager';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function EditRetentionGuaranteePage({ params }: { params: { id: string } }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retention, setRetention] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchRetentionDetails();
  }, [params.id]);

  const fetchRetentionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/retention-guarantees/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des détails de la retenue');
      }
      
      const data = await response.json();
      setRetention(data);
      setReleases(data.releases || []);
      
      // Initialiser le formulaire avec les données
      form.setFieldsValue({
        rate: data.rate,
        amount: data.amount,
        releaseDate: data.releaseDate ? dayjs(data.releaseDate) : undefined,
        status: data.status,
        notes: data.notes
      });
      
      // Récupérer les détails de la facture associée
      if (data.invoiceId) {
        const invoiceResponse = await fetch(`/api/invoices/${data.invoiceId}`);
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          setInvoice(invoiceData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les détails de la retenue de garantie');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasesChange = (updatedReleases: any[]) => {
    setReleases(updatedReleases);
    
    // Mettre à jour le statut en fonction des libérations
    const totalAmount = retention?.amount || 0;
    const releasedAmount = updatedReleases.reduce((sum, release) => sum + release.amount, 0);
    
    let newStatus = 'PENDING';
    if (releasedAmount >= totalAmount) {
      newStatus = 'RELEASED';
    } else if (releasedAmount > 0) {
      newStatus = 'PARTIAL';
    }
    
    form.setFieldsValue({ status: newStatus });
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
      const updateData = {
        ...values,
        releaseDate: values.releaseDate ? values.releaseDate.format('YYYY-MM-DD') : null,
        releases: releases
      };
      
      const response = await fetch(`/api/retention-guarantees/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour de la retenue');
      }
      
      message.success('Retenue de garantie mise à jour avec succès');
      router.push(`/retention-guarantees/${params.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la mise à jour de la retenue de garantie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/retention-guarantees/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!retention) {
    return (
      <div className="p-6">
        <Alert
          message="Retenue de garantie non trouvée"
          description="La retenue de garantie demandée n'existe pas ou a été supprimée."
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={() => router.push('/retention-guarantees')}>
              Retour à la liste
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          Retour aux détails
        </Button>
      </div>

      <Title level={2}>Modifier la retenue de garantie</Title>
      
      <Card className="mb-6">
        <div className="mb-4">
          <Text strong>Facture:</Text> {invoice?.reference || 'Non disponible'}
        </div>
        <div className="mb-4">
          <Text strong>Client:</Text> {invoice?.contact?.nom || 
                                      invoice?.contact?.name || 
                                      invoice?.contact?.company || 
                                      'Non disponible'}
        </div>
        <div className="mb-4">
          <Text strong>Montant de la facture:</Text> {invoice ? `${invoice.totalHT.toFixed(2)} € HT` : 'Non disponible'}
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={16}>
            <Card title="Informations de la retenue" className="mb-6">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="rate"
                    label="Taux de retenue (%)"
                    rules={[{ required: true, message: 'Veuillez saisir le taux de retenue' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={2}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="Montant de la retenue (€)"
                    rules={[{ required: true, message: 'Veuillez saisir le montant de la retenue' }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="releaseDate"
                    label="Date de libération prévue"
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="status"
                    label="Statut"
                    rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
                  >
                    <Select>
                      <Option value="PENDING">En attente</Option>
                      <Option value="PARTIAL">Partiellement libérée</Option>
                      <Option value="RELEASED">Libérée</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="notes"
                label="Notes"
              >
                <TextArea rows={4} />
              </Form.Item>
            </Card>
            
            <Card title="Historique des libérations" className="mb-6">
              <RetentionReleaseManager
                retentionId={params.id}
                totalAmount={retention.amount}
                releases={releases}
                onReleasesChange={handleReleasesChange}
              />
            </Card>
          </Col>
          
          <Col span={8}>
            <Card title="Actions" className="mb-6">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
                block
                size="large"
                style={{ marginBottom: 16 }}
              >
                Enregistrer les modifications
              </Button>
              
              <Button
                onClick={handleGoBack}
                block
              >
                Annuler
              </Button>
            </Card>
            
            <Alert
              message="Information"
              description="La modification du statut et des libérations peut avoir un impact sur la facturation et la comptabilité."
              type="info"
              showIcon
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Spin, message, Descriptions, Tag, Button, Row, Col, Divider, Timeline, Statistic, Alert } from 'antd';
import { ArrowLeftOutlined, EditOutlined, FileTextOutlined, PrinterOutlined, HistoryOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import RetentionReleaseManager from '@/components/RetentionReleaseManager';

const { Title, Text, Paragraph } = Typography;

export default function RetentionGuaranteeDetailPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [retention, setRetention] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'PARTIAL':
        return 'blue';
      case 'RELEASED':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'PARTIAL':
        return 'Partiellement libérée';
      case 'RELEASED':
        return 'Libérée';
      default:
        return status;
    }
  };

  const isOverdue = () => {
    return retention?.status === 'PENDING' && 
           retention?.releaseDate && 
           dayjs(retention.releaseDate).isBefore(dayjs());
  };

  const calculateReleasedAmount = () => {
    if (!retention?.releases || retention.releases.length === 0) return 0;
    return retention.releases.reduce((sum: number, release: any) => sum + release.amount, 0);
  };

  const calculateRemainingAmount = () => {
    const releasedAmount = calculateReleasedAmount();
    return retention ? retention.amount - releasedAmount : 0;
  };

  const handleEdit = () => {
    router.push(`/retention-guarantees/${params.id}/edit`);
  };

  const handleGoToInvoice = () => {
    if (invoice) {
      router.push(`/invoices/${invoice.id}`);
    }
  };

  const handleGoBack = () => {
    router.push('/retention-guarantees');
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
            <Button type="primary" onClick={handleGoBack}>
              Retour à la liste
            </Button>
          }
        />
      </div>
    );
  }

  const releasedAmount = calculateReleasedAmount();
  const remainingAmount = calculateRemainingAmount();
  const releasePercentage = retention.amount > 0 ? (releasedAmount / retention.amount) * 100 : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={handleGoBack}>
          Retour à la liste
        </Button>
        <div>
          <Button 
            icon={<EditOutlined />} 
            onClick={handleEdit}
            style={{ marginRight: 8 }}
          >
            Modifier
          </Button>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={() => message.info('Fonctionnalité d\'impression à implémenter')}
          >
            Imprimer
          </Button>
        </div>
      </div>

      <Title level={2}>
        Détails de la retenue de garantie
        <Tag color={getStatusColor(retention.status)} style={{ marginLeft: 12 }}>
          {getStatusText(retention.status)}
        </Tag>
      </Title>

      {isOverdue() && (
        <Alert
          message="Retenue en retard"
          description={`La date de libération prévue (${dayjs(retention.releaseDate).format('DD/MM/YYYY')}) est dépassée.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Informations générales" className="mb-6">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Facture" span={2}>
                <Button type="link" onClick={handleGoToInvoice}>
                  {invoice?.reference || 'Non disponible'}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="Client">
                {invoice?.contact?.nom || 
                 invoice?.contact?.name || 
                 invoice?.contact?.company || 
                 'Non disponible'}
              </Descriptions.Item>
              <Descriptions.Item label="Date de facture">
                {invoice?.invoiceDate ? dayjs(invoice.invoiceDate).format('DD/MM/YYYY') : 'Non disponible'}
              </Descriptions.Item>
              <Descriptions.Item label="Montant de la facture">
                {invoice ? `${invoice.totalHT.toFixed(2)} € HT` : 'Non disponible'}
              </Descriptions.Item>
              <Descriptions.Item label="Taux de retenue">
                {retention.rate}%
              </Descriptions.Item>
              <Descriptions.Item label="Montant de la retenue">
                {retention.amount.toFixed(2)} €
              </Descriptions.Item>
              <Descriptions.Item label="Date de libération prévue">
                {retention.releaseDate ? dayjs(retention.releaseDate).format('DD/MM/YYYY') : 'Non définie'}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(retention.status)}>
                  {getStatusText(retention.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {retention.notes || 'Aucune note'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Historique des libérations" className="mb-6">
            <RetentionReleaseManager
              retentionId={params.id}
              totalAmount={retention.amount}
              releases={retention.releases || []}
              onReleasesChange={() => {}}
              readOnly={true}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card className="mb-6">
            <Statistic
              title="Montant total de la retenue"
              value={retention.amount}
              precision={2}
              suffix="€"
            />
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Montant libéré"
                  value={releasedAmount}
                  precision={2}
                  suffix="€"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Montant restant"
                  value={remainingAmount}
                  precision={2}
                  suffix="€"
                  valueStyle={{ color: remainingAmount > 0 ? '#faad14' : '#3f8600' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text>Progression de la libération:</Text>
              <div style={{ 
                height: 20, 
                backgroundColor: '#f0f0f0', 
                borderRadius: 10, 
                marginTop: 8,
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${releasePercentage}%`, 
                  height: '100%', 
                  backgroundColor: '#52c41a',
                  borderRadius: 10
                }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Text>{releasePercentage.toFixed(0)}% libéré</Text>
              </div>
            </div>
          </Card>

          <Card title="Chronologie" className="mb-6">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Création de la retenue</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(retention.createdAt).format('DD/MM/YYYY')}
                      </Text>
                    </>
                  ),
                  dot: <FileTextOutlined />
                },
                ...(retention.releases || []).map((release: any) => ({
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>Libération partielle</Text>
                      <br />
                      <Text>{release.amount.toFixed(2)} €</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(release.releaseDate).format('DD/MM/YYYY')}
                      </Text>
                    </>
                  ),
                  dot: <HistoryOutlined />
                })),
                {
                  color: retention.status === 'RELEASED' ? 'green' : 'gray',
                  children: (
                    <>
                      <Text strong>Libération complète</Text>
                      <br />
                      <Text type="secondary">
                        {retention.status === 'RELEASED' 
                          ? 'Terminée'
                          : 'En attente'}
                      </Text>
                    </>
                  ),
                  dot: retention.status === 'RELEASED' 
                    ? <CheckCircleOutlined /> 
                    : <ClockCircleOutlined />
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
} 
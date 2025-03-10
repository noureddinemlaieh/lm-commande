'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Typography, Space, Alert, Select, Table, Divider, InputNumber, Row, Col, Statistic, Switch, Collapse, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formDevis] = Form.useForm();
  const [formFacture] = Form.useForm();
  const [formBonCommande] = Form.useForm();
  
  // Définir une interface pour l'historique de numérotation
  interface NumberingHistoryItem {
    id: string;
    type: string;
    number: string;
    createdAt: string;
    user: string;
    used: boolean;
  }
  
  const [numberingHistory, setNumberingHistory] = useState<NumberingHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reservedNumbers, setReservedNumbers] = useState<NumberingHistoryItem[]>([]);
  const [loadingReserved, setLoadingReserved] = useState(false);
  const [stats, setStats] = useState({
    devis: { total: 0, thisYear: 0 },
    facture: { total: 0, thisYear: 0 },
    bon_commande: { total: 0, thisYear: 0 }
  });
  const { user, hasPermission } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings/by-category?category=NUMEROTATION');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        // Paramètres pour les devis
        formDevis.setFieldsValue({
          devis_prefix: data.devis_prefix || 'DEV',
          devis_digits: data.devis_digits || '4',
          devis_counter: data.devis_counter || '1',
          devis_format: data.devis_format || '{PREFIX}{COUNTER}',
          devis_reset_period: data.devis_reset_period || 'never'
        });
        
        // Paramètres pour les factures
        formFacture.setFieldsValue({
          facture_prefix: data.facture_prefix || 'FAC',
          facture_digits: data.facture_digits || '4',
          facture_counter: data.facture_counter || '1',
          facture_format: data.facture_format || '{PREFIX}{COUNTER}',
          facture_reset_period: data.facture_reset_period || 'never'
        });
        
        // Paramètres pour les bons de commande
        formBonCommande.setFieldsValue({
          bon_commande_prefix: data.bon_commande_prefix || 'BC',
          bon_commande_digits: data.bon_commande_digits || '4',
          bon_commande_counter: data.bon_commande_counter || '1',
          bon_commande_format: data.bon_commande_format || '{PREFIX}{COUNTER}',
          bon_commande_reset_period: data.bon_commande_reset_period || 'never'
        });
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Une erreur inconnue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const initializeSettings = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/settings/initialize', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      message.success('Paramètres initialisés avec succès');
      
      // Recharger les paramètres
      await fetchSettings();
    } catch (error: any) {
      console.error(error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const setupDatabase = async () => {
    setInitializing(true);
    try {
      const response = await fetch('/api/settings/setup-db', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      message.success('Base de données configurée avec succès');
      
      // Recharger les paramètres
      await fetchSettings();
    } catch (error: any) {
      console.error(error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const saveSettings = async (values, type) => {
    setLoading(true);
    try {
      // Validation des données avant envoi
      Object.entries(values).forEach(([key, value]) => {
        if (key.includes('digits') || key.includes('counter')) {
          if (!/^\d+$/.test(String(value))) {
            throw new Error(`Le champ ${key} doit être un nombre entier`);
          }
        }
      });
      
      console.log('Données à envoyer:', values); // Pour le débogage
      
      const settingsToSave = Object.entries(values).map(([key, value]) => ({
        key,
        value: String(value), // Convertir en chaîne pour éviter les problèmes de type
        category: 'NUMEROTATION',
        description: getDescriptionForKey(key)
      }));
      
      const response = await fetch('/api/settings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erreur lors de la sauvegarde');
      }
      
      message.success(`Paramètres de numérotation ${type} enregistrés avec succès`);
    } catch (error: any) {
      console.error(error);
      message.error(`Erreur: ${error.message || `Erreur lors de l'enregistrement des paramètres de ${type}`}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour ajouter des descriptions aux paramètres
  const getDescriptionForKey = (key) => {
    const descriptions = {
      devis_prefix: 'Préfixe pour les numéros de devis',
      devis_digits: 'Nombre de chiffres pour le compteur de devis',
      devis_counter: 'Compteur actuel pour les devis',
      devis_format: 'Format de numérotation des devis',
      
      facture_prefix: 'Préfixe pour les numéros de facture',
      facture_digits: 'Nombre de chiffres pour le compteur de facture',
      facture_counter: 'Compteur actuel pour les factures',
      facture_format: 'Format de numérotation des factures',
      
      bon_commande_prefix: 'Préfixe pour les numéros de bon de commande',
      bon_commande_digits: 'Nombre de chiffres pour le compteur de bon de commande',
      bon_commande_counter: 'Compteur actuel pour les bons de commande',
      bon_commande_format: 'Format de numérotation des bons de commande',
    };
    
    return descriptions[key] || '';
  };

  const generateExample = (form, type) => {
    const values = form.getFieldsValue();
    const prefix = values[`${type}_prefix`] || '';
    const digits = parseInt(values[`${type}_digits`] || '4', 10);
    const counter = String(values[`${type}_counter`] || '1').padStart(digits, '0');
    const format = values[`${type}_format`] || '{COUNTER}';
    
    return format
      .replace('{PREFIX}', prefix)
      .replace('{COUNTER}', counter);
  };

  const renderNumberingForm = (form, type, title) => {
    const typeName = type.toLowerCase();
    
    return (
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => saveSettings(values, title)}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={4}>{title}</Title>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name={`${typeName}_prefix`}
              label="Préfixe"
              tooltip="Texte qui apparaît avant le numéro"
            >
              <Input placeholder="Ex: DEV" />
            </Form.Item>
            
            <Form.Item
              name={`${typeName}_digits`}
              label="Nombre de chiffres"
              tooltip="Nombre de chiffres pour le compteur (avec des zéros devant si nécessaire)"
              rules={[{ pattern: /^\d+$/, message: 'Veuillez entrer un nombre' }]}
            >
              <Input placeholder="Ex: 4" />
            </Form.Item>
            
            <Form.Item
              name={`${typeName}_counter`}
              label="Compteur actuel"
              tooltip="Valeur actuelle du compteur"
              rules={[{ pattern: /^\d+$/, message: 'Veuillez entrer un nombre' }]}
            >
              <Input placeholder="Ex: 1" />
            </Form.Item>
            
            <Form.Item
              name={`${typeName}_reset_period`}
              label="Période de réinitialisation"
              tooltip="Quand le compteur doit-il être réinitialisé à 1"
            >
              <Select defaultValue="never">
                <Select.Option value="never">Jamais</Select.Option>
                <Select.Option value="yearly">Chaque année</Select.Option>
                <Select.Option value="monthly">Chaque mois</Select.Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item
            name={`${typeName}_format`}
          >
            {generateExample(form, typeName)}
          </Form.Item>
          
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <Text strong>Exemple de numérotation: </Text>
            <Text>{generateExample(form, typeName)}</Text>
          </div>
          
          {hasPermission('settings.numbering.edit') ? (
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Enregistrer
              </Button>
            </Form.Item>
          ) : (
            <Form.Item>
              <Tooltip title="Vous n'avez pas les permissions nécessaires">
                <Button type="primary" disabled icon={<SaveOutlined />}>
                  Enregistrer
                </Button>
              </Tooltip>
            </Form.Item>
          )}
        </Space>
      </Form>
    );
  };

  const fetchNumberingHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/numbering-history');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        setNumberingHistory(data as NumberingHistoryItem[]);
      }
    } catch (error: any) {
      console.error(error);
      message.error('Erreur lors de la récupération de l\'historique des numéros');
    } finally {
      setLoadingHistory(false);
    }
  };

  const reserveNumbers = async (values) => {
    setLoadingReserved(true);
    try {
      const response = await fetch('/api/numbering/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erreur lors de la réservation des numéros');
      }
      
      message.success('Numéros réservés avec succès');
      await fetchNumberingHistory();
    } catch (error: any) {
      console.error(error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setLoadingReserved(false);
    }
  };

  const releaseNumber = async (id) => {
    setLoadingReserved(true);
    try {
      const response = await fetch(`/api/numbering/release/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Erreur lors de la libération du numéro');
      }
      
      message.success('Numéro libéré avec succès');
      await fetchNumberingHistory();
    } catch (error: any) {
      console.error(error);
      message.error(`Erreur: ${error.message}`);
    } finally {
      setLoadingReserved(false);
    }
  };

  const saveAlertSettings = async (values) => {
    try {
      const settingsToSave = Object.entries(values).map(([key, value]) => ({
        key,
        value: String(value),
        category: 'ALERTES',
        description: getAlertDescriptionForKey(key)
      }));
      
      const response = await fetch('/api/settings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Erreur lors de la sauvegarde');
      }
      
      message.success('Paramètres d\'alerte enregistrés avec succès');
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        message.error(`Erreur: ${error.message}`);
      } else {
        message.error('Une erreur inconnue est survenue');
      }
    }
  };

  // Fonction utilitaire pour les descriptions des alertes
  const getAlertDescriptionForKey = (key) => {
    const descriptions = {
      alert_duplicate: 'Alerter en cas de détection de doublons',
      alert_gap: 'Alerter en cas de détection de sauts dans la séquence',
      alert_threshold: 'Seuil d\'alerte pour les compteurs élevés',
      alert_recipients: 'Destinataires des alertes'
    };
    
    return descriptions[key] || '';
  };

  const testNumberFormat = async (type) => {
    try {
      const response = await fetch(`/api/${type}/sequence`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      message.info(`Exemple de numéro généré: ${data.reference}`);
    } catch (error: unknown) {
      console.error('Erreur lors du test:', error);
      if (error instanceof Error) {
        message.error(`Erreur: ${error.message}`);
      } else {
        message.error('Une erreur inconnue est survenue');
      }
    }
  };

  const items = [
    {
      key: 'devis',
      label: 'Devis',
      children: renderNumberingForm(formDevis, 'devis', 'Devis')
    },
    {
      key: 'facture',
      label: 'Facture',
      children: renderNumberingForm(formFacture, 'facture', 'Facture')
    },
    {
      key: 'bon_commande',
      label: 'Bon de commande',
      children: renderNumberingForm(formBonCommande, 'bon_commande', 'Bon de commande')
    },
    {
      key: 'journal',
      label: 'Journal de numérotation',
      children: (
        <Card title="Historique des numéros générés">
          <Table
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Numéro', dataIndex: 'number', key: 'number' },
              { title: 'Date de génération', dataIndex: 'createdAt', key: 'createdAt' },
              { title: 'Utilisateur', dataIndex: 'user', key: 'user' },
            ]}
            dataSource={numberingHistory}
            loading={loadingHistory}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'reservation',
      label: 'Réservation de numéros',
      children: (
        <Card title="Réserver des numéros à l'avance">
          <Form layout="vertical" onFinish={reserveNumbers}>
            <Form.Item
              name="type"
              label="Type de document"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="devis">Devis</Select.Option>
                <Select.Option value="facture">Facture</Select.Option>
                <Select.Option value="bon_commande">Bon de commande</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="count"
              label="Nombre de numéros à réserver"
              rules={[{ required: true, type: 'number', min: 1, max: 100 }]}
            >
              <InputNumber min={1} max={100} />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Réserver
              </Button>
            </Form.Item>
          </Form>
          
          <Divider />
          
          <Table
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Numéro', dataIndex: 'number', key: 'number' },
              { title: 'Réservé le', dataIndex: 'reservedAt', key: 'reservedAt' },
              { title: 'Utilisé', dataIndex: 'used', key: 'used', render: used => used ? 'Oui' : 'Non' },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Button disabled={record.used} onClick={() => releaseNumber(record.id)}>
                    Libérer
                  </Button>
                )
              }
            ]}
            dataSource={reservedNumbers}
            loading={loadingReserved}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'stats',
      label: 'Statistiques',
      children: (
        <Card title="Statistiques de numérotation">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Devis générés"
                value={stats.devis.total}
                suffix={<small>/ {stats.devis.thisYear} cette année</small>}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Factures générées"
                value={stats.facture.total}
                suffix={<small>/ {stats.facture.thisYear} cette année</small>}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Bons de commande générés"
                value={stats.bon_commande.total}
                suffix={<small>/ {stats.bon_commande.thisYear} cette année</small>}
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={4}>Évolution mensuelle</Title>
          {/* Ajouter un graphique d'évolution */}
        </Card>
      )
    },
    {
      key: 'alerts',
      label: 'Alertes',
      children: (
        <Card title="Configuration des alertes">
          <Form layout="vertical" onFinish={saveAlertSettings}>
            <Form.Item
              name="alert_duplicate"
              valuePropName="checked"
              label="Alerter en cas de détection de doublons"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="alert_gap"
              valuePropName="checked"
              label="Alerter en cas de détection de sauts dans la séquence"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="alert_threshold"
              label="Seuil d'alerte pour les compteurs élevés"
              tooltip="Envoyer une alerte lorsque le compteur dépasse cette valeur"
            >
              <InputNumber min={1000} step={1000} />
            </Form.Item>
            
            <Form.Item
              name="alert_recipients"
              label="Destinataires des alertes"
              tooltip="Adresses email séparées par des virgules"
            >
              <Input placeholder="email@example.com, autre@example.com" />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Enregistrer les paramètres d'alerte
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'docs',
      label: 'Documentation',
      children: (
        <Card title="Documentation du système de numérotation">
          <Collapse defaultActiveKey={['1']}>
            <Collapse.Panel header="Principes généraux" key="1">
              <Typography.Paragraph>
                Le système de numérotation génère des identifiants uniques pour les devis, factures et bons de commande.
                Chaque numéro est composé d'un préfixe et d'un compteur séquentiel.
              </Typography.Paragraph>
            </Collapse.Panel>
            
            <Collapse.Panel header="Variables disponibles" key="2">
              <Typography.Paragraph>
                <ul>
                  <li><strong>{'{PREFIX}'}</strong> : Le préfixe configuré</li>
                  <li><strong>{'{COUNTER}'}</strong> : Le compteur séquentiel</li>
                  <li><strong>{'{YYYY}'}</strong> : L'année en cours (4 chiffres)</li>
                  <li><strong>{'{YY}'}</strong> : L'année en cours (2 chiffres)</li>
                  <li><strong>{'{MM}'}</strong> : Le mois en cours (2 chiffres)</li>
                </ul>
              </Typography.Paragraph>
            </Collapse.Panel>
            
            <Collapse.Panel header="Bonnes pratiques" key="3">
              <Typography.Paragraph>
                <ul>
                  <li>Utilisez des préfixes distincts pour chaque type de document</li>
                  <li>Configurez un nombre suffisant de chiffres pour le compteur</li>
                  <li>Évitez de modifier les compteurs en cours d'année fiscale</li>
                </ul>
              </Typography.Paragraph>
            </Collapse.Panel>
          </Collapse>
        </Card>
      )
    }
  ];

  return (
    <Tabs items={items} />
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Checkbox, Divider, Radio, InputNumber, Upload, Table, Modal, App } from 'antd';
import { useRouter } from 'next/navigation';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

export default function NewPrescriberPage() {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [contactForm] = Form.useForm();
  const [form] = Form.useForm();
  const [editingClient, setEditingClient] = useState<any>(null);
  const router = useRouter();
  const { message } = App.useApp();
  
  // Utiliser Form.useWatch pour surveiller les changements de valeur
  const requiresRetentionGuarantee = Form.useWatch('requiresRetentionGuarantee', form);

  // Initialiser le formulaire
  useEffect(() => {
    form.setFieldsValue({
      requiresRetentionGuarantee: false,
      defaultRetentionRate: 5,
      defaultAutoliquidation: false,
      defaultBillToPrescriber: false
    });
  }, [form]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Ajouter les clients temporaires
      values.clients = clients;
      
      // Ajouter l'URL du logo aux valeurs si disponible
      if (fileList.length > 0 && fileList[0].response) {
        values.logo = fileList[0].response.url;
        console.log('Utilisation du logo nouvellement téléchargé:', fileList[0].response.url);
      } else if (fileList.length > 0 && fileList[0].url) {
        values.logo = fileList[0].url;
        console.log('Utilisation du logo existant:', fileList[0].url);
      } else {
        values.logo = null;
        console.log('Aucun logo à enregistrer');
      }
      
      console.log('Valeurs à envoyer:', values);
      
      const response = await fetch('/api/prescribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur lors de la création:', errorData);
        message.error(`Erreur lors de la création: ${errorData.error || 'Erreur inconnue'}`);
        setLoading(false);
        return;
      }

      message.success('Prescripteur créé avec succès');
      router.push('/prescribers');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      message.error("Impossible de créer le prescripteur");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newFileList, file }) => {
    setFileList(newFileList);
    
    // Si le fichier a été téléchargé avec succès et contient une réponse
    if (file && file.status === 'done' && file.response) {
      // Mettre à jour le formulaire avec l'URL du logo
      form.setFieldsValue({ logo: file.response.url });
      console.log('Logo téléchargé avec succès:', file.response.url);
    }
    
    // Si tous les fichiers ont été supprimés
    if (newFileList.length === 0) {
      form.setFieldsValue({ logo: null });
      console.log('Logo supprimé');
    }
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Télécharger</div>
    </div>
  );

  const showContactModal = (client?: any) => {
    setEditingClient(client || null);
    contactForm.resetFields();
    if (client) {
      contactForm.setFieldsValue(client);
    }
    setIsContactModalVisible(true);
  };

  const handleContactOk = async () => {
    try {
      const values = await contactForm.validateFields();
      
      // Générer un ID temporaire pour le client
      const tempId = `temp_${Date.now()}`;
      const newClient = { ...values, id: tempId };
      
      // Mettre à jour la liste des clients
      if (editingClient) {
        setClients(clients.map(c => c.id === editingClient.id ? { ...newClient, id: editingClient.id } : c));
      } else {
        setClients([...clients, newClient]);
      }
      
      setIsContactModalVisible(false);
      message.success(`Client ${editingClient ? 'modifié' : 'ajouté'} avec succès`);
    } catch (error) {
      message.error("Erreur lors de l'enregistrement du client");
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter(c => c.id !== clientId));
    message.success('Client supprimé');
  };

  const clientColumns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Poste',
      dataIndex: 'company',
      key: 'company',
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
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: any) => (
        <div className="flex space-x-2">
          <Button 
            type="link" 
            onClick={() => showContactModal(record)}
          >
            Modifier
          </Button>
          <Button 
            type="link" 
            danger 
            onClick={() => handleDeleteClient(record.id)}
            icon={<DeleteOutlined />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nouveau Prescripteur</h1>
      </div>

      <Card>
        <Form
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          form={form}
          initialValues={{
            requiresRetentionGuarantee: false,
            defaultRetentionRate: 5,
            defaultAutoliquidation: false,
            defaultBillToPrescriber: false
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <Form.Item
                label="Nom"
                name="nom"
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input />
              </Form.Item>
            </div>
            
            <div className="col-span-1">
              <Form.Item label="Logo" name="logo">
                <Upload
                  name="file"
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  maxCount={1}
                  action="/api/upload"
                  showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Contact" name="contact">
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Email principal" name="mail1">
              <Input type="email" />
            </Form.Item>
            <Form.Item label="Email secondaire" name="mail2">
              <Input type="email" />
            </Form.Item>
            <Form.Item label="Email tertiaire" name="mail3">
              <Input type="email" />
            </Form.Item>

            <Form.Item label="Téléphone principal" name="tel1">
              <Input />
            </Form.Item>
            <Form.Item label="Téléphone secondaire" name="tel2">
              <Input />
            </Form.Item>
            <Form.Item label="Téléphone tertiaire" name="tel3">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Rue" name="rue">
            <Input />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item label="Code postal" name="cp">
              <Input />
            </Form.Item>
            <Form.Item label="Ville" name="ville">
              <Input />
            </Form.Item>
            <Form.Item label="Pays" name="pays">
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Site web" name="siteweb">
              <Input />
            </Form.Item>
            <Form.Item label="Téléphone standard" name="tel">
              <Input />
            </Form.Item>
            <Form.Item label="SIRET" name="siret">
              <Input />
            </Form.Item>
            <Form.Item label="N° TVA" name="tva">
              <Input />
            </Form.Item>
          </div>

          <Divider>Contacts</Divider>
          
          <div className="mb-4">
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showContactModal()}
            >
              Ajouter un contact
            </Button>
          </div>
          
          <Table 
            dataSource={clients} 
            columns={clientColumns} 
            rowKey="id"
            pagination={false}
          />

          <Divider>Paramètres de facturation</Divider>

          <Form.Item 
            name="requiresRetentionGuarantee" 
            valuePropName="checked"
          >
            <Checkbox>
              Appliquer une retenue de garantie sur les factures
            </Checkbox>
          </Form.Item>
          <div className="text-sm text-gray-500 mb-4 ml-6">
            Si cette option est activée, une retenue de garantie sera automatiquement appliquée 
            lorsque ce prescripteur est facturé (option "Facturer au prescripteur").
          </div>

          {/* Approche sans imbrication de Form.Item */}
          <Form.Item
            name="defaultRetentionRate"
            label="Taux de retenue de garantie (%)"
            rules={[{ 
              required: form.getFieldValue('requiresRetentionGuarantee'), 
              message: 'Veuillez saisir le taux de retenue' 
            }]}
            initialValue={5}
            style={{ display: requiresRetentionGuarantee ? 'block' : 'none' }}
            dependencies={['requiresRetentionGuarantee']}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '120px' }}
              className="ant-input-number-right"
              controls={true}
            />
          </Form.Item>

          <Form.Item 
            name="defaultAutoliquidation" 
            valuePropName="checked"
          >
            <Checkbox>
              Appliquer l'autoliquidation par défaut
            </Checkbox>
          </Form.Item>
          <div className="text-sm text-gray-500 mb-4 ml-6">
            Si cette option est activée, l'autoliquidation sera automatiquement appliquée 
            sur les factures associées à ce prescripteur.
          </div>

          <Form.Item
            name="defaultBillToPrescriber"
            label="Facturation par défaut"
          >
            <Radio.Group>
              <Radio value={false}>Client</Radio>
              <Radio value={true}>Prescripteur</Radio>
            </Radio.Group>
          </Form.Item>
          <div className="text-sm text-gray-500 mb-4 ml-6">
            Détermine si les factures sont adressées par défaut au client ou au prescripteur.
          </div>

          <Form.Item>
            <div className="flex justify-end gap-4">
              <Button onClick={() => router.push('/prescribers')}>
                Annuler
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Créer
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title={editingClient ? "Modifier le client" : "Ajouter un client"}
        open={isContactModalVisible}
        onOk={handleContactOk}
        onCancel={() => setIsContactModalVisible(false)}
      >
        <Form
          form={contactForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nom"
            rules={[{ required: true, message: 'Le nom est requis' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="company"
            label="Poste"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Téléphone"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 
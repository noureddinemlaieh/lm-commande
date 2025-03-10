'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, message, Spin, Checkbox, Radio, Typography, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { PAYMENT_METHODS, PAYMENT_CONDITIONS } from '@/types/payment';
import { INVOICE_STATUSES, PAYMENT_STATUSES } from '@/types/Invoice';
import InvoiceEditor from '@/components/InvoiceEditor';
import { v4 as uuidv4 } from 'uuid';
import RetentionGuaranteeForm from '@/components/RetentionGuaranteeForm';

const { Title } = Typography;

export default function NewInvoicePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isAutoliquidation, setIsAutoliquidation] = useState(false);
  const [devisList, setDevisList] = useState<any[]>([]);
  const [loadingDevis, setLoadingDevis] = useState(false);
  const router = useRouter();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);
  const [selectedDevisData, setSelectedDevisData] = useState<any>(null);
  const [hasRetention, setHasRetention] = useState(false);
  const [retentionData, setRetentionData] = useState<any>(null);

  // Charger les contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Erreur lors du chargement des clients');
        const data = await response.json();
        setContacts(data);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        message.error('Impossible de charger les clients');
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // Charger les devis lorsqu'un contact est sélectionné
  useEffect(() => {
    const fetchDevis = async () => {
      if (!selectedContact) {
        setDevisList([]);
        return;
      }
      
      try {
        setLoadingDevis(true);
        const response = await fetch(`/api/devis?clientId=${selectedContact}&status=ACCEPTED`);
        if (!response.ok) throw new Error('Erreur lors du chargement des devis');
        const data = await response.json();
        
        // Filtrer les devis qui n'ont pas encore été facturés ou partiellement facturés
        const filteredDevis = data.filter((devis: any) => 
          !devis.invoiced || devis.invoiced === 'PARTIAL'
        );
        
        setDevisList(filteredDevis);
      } catch (error) {
        console.error('Erreur:', error);
        message.error('Impossible de charger les devis');
      } finally {
        setLoadingDevis(false);
      }
    };

    fetchDevis();
  }, [selectedContact]);

  const handleContactChange = (value: string) => {
    setSelectedContact(value);
    form.setFieldsValue({ devisId: undefined });
  };

  const handleDevisChange = async (devisId: string) => {
    if (!devisId) {
      form.setFieldsValue({ devisId: undefined });
      return;
    }
    
    try {
      setLoading(true);
      // Charger les détails du devis sélectionné
      const response = await fetch(`/api/devis/${devisId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement du devis');
      const devis = await response.json();
      
      // Stocker l'ID et les données du devis sélectionné
      setSelectedDevisId(devisId);
      setSelectedDevisData(devis);
      
      // Afficher la boîte de dialogue de confirmation
      setIsModalVisible(true);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les détails du devis');
      form.setFieldsValue({ devisId: undefined });
    } finally {
      setLoading(false);
    }
  };

  const convertDevisSectionsToInvoiceSections = (devis: any) => {
    return devis.sections.map((section: any) => ({
      id: uuidv4(),
      name: section.name,
      subTotal: section.subTotal,
      items: section.services.map((service: any) => ({
        id: uuidv4(),
        name: service.name,
        description: service.description,
        quantity: service.quantity,
        unit: service.unit || 'unité',
        unitPrice: service.price,
        tva: service.tva || 20,
        amount: service.quantity * service.price,
        materials: service.materials ? service.materials.map((material: any) => ({
          id: uuidv4(),
          name: material.name,
          quantity: material.quantity,
          price: material.price,
          unit: material.unit || 'unité',
          reference: material.reference,
          tva: material.tva || 20
        })) : []
      }))
    }));
  };

  const handleModalConfirm = () => {
    if (selectedDevisData) {
      // Convertir les sections du devis en sections de facture
      const invoiceSections = convertDevisSectionsToInvoiceSections(selectedDevisData);
      setSections(invoiceSections);
    }
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    // Ne pas utiliser les sections du devis, mais conserver la référence au devis
    setIsModalVisible(false);
  };

  const handleSectionsChange = (updatedSections: any[]) => {
    setSections(updatedSections);
  };

  const calculateTotals = (sections: any[], isAutoliquidation: boolean) => {
    let totalHT = 0;
    let totalTVA = 0;

    sections.forEach(section => {
      section.items.forEach((item: any) => {
        const itemHT = item.quantity * item.unitPrice;
        const itemTVA = isAutoliquidation ? 0 : itemHT * (item.tva / 100);
        totalHT += itemHT;
        totalTVA += itemTVA;
      });
    });

    // Appliquer la retenue de garantie si nécessaire
    let finalTotalHT = totalHT;
    if (hasRetention && retentionData && retentionData.amount) {
      finalTotalHT = totalHT - retentionData.amount;
    }

    return {
      totalHT: finalTotalHT,
      totalTVA: isAutoliquidation ? 0 : totalTVA,
      totalTTC: finalTotalHT + (isAutoliquidation ? 0 : totalTVA),
      originalTotalHT: totalHT // Montant HT avant retenue
    };
  };

  const handleAutoliquidationChange = (checked: boolean) => {
    setIsAutoliquidation(checked);
    
    if (checked) {
      const updatedSections = sections.map(section => ({
        ...section,
        items: section.items.map(item => ({
          ...item,
          tva: 0,
          amount: item.quantity * item.unitPrice
        }))
      }));
      setSections(updatedSections);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Vérifier si nous avons des sections ou si nous devons en créer une vide
      let sectionsToSubmit = [...sections];
      
      // Si aucune section n'existe et que createEmptySection est true, créer une section vide
      if (sectionsToSubmit.length === 0 && values.createEmptySection) {
        sectionsToSubmit = [{
          id: uuidv4(),
          name: "Section par défaut",
          subTotal: 0,
          items: []
        }];
      }
      
      // Si nous n'avons pas de sections et que createEmptySection est false, c'est OK
      // (nous envoyons un tableau vide)
      
      const { totalHT, totalTVA, totalTTC, originalTotalHT } = calculateTotals(sectionsToSubmit, values.autoliquidation);
      
      // Préparer les données de retenue de garantie si nécessaire
      const retentionGuaranteeData = hasRetention && retentionData ? {
        rate: retentionData.rate,
        amount: retentionData.amount,
        releaseDate: retentionData.releaseDate,
        notes: retentionData.notes
      } : null;
      
      const invoiceData = {
        clientId: values.clientId,
        devisId: values.devisId || null,
        status: values.status,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
        invoiceDate: values.invoiceDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        paymentConditions: values.paymentConditions,
        autoliquidation: values.autoliquidation || false,
        billToPrescriber: values.billToPrescriber || false,
        notes: values.notes,
        sections: sectionsToSubmit,
        totalHT,
        totalTVA,
        totalTTC,
        retentionGuarantee: retentionGuaranteeData
      };
      
      console.log("Données de facture à envoyer:", invoiceData);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error('Erreur lors de la création de la facture');
      }
      
      const newInvoice = await response.json();
      message.success('Facture créée avec succès');
      router.push(`/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      createEmptySection: false,
      // autres valeurs par défaut si nécessaire
    });
  }, [form]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Facture</h1>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'DRAFT',
            paymentStatus: 'UNPAID',
            paymentMethod: 'Virement bancaire',
            invoiceDate: dayjs(),
            dueDate: dayjs().add(30, 'day'),
            createEmptySection: false,
            paymentConditions: "30 jours",
            autoliquidation: false,
            billToPrescriber: false
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="clientId"
              label="Client"
              rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
            >
              <Select 
                placeholder="Sélectionner un client"
                onChange={handleContactChange}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={contacts.map(contact => ({
                  value: contact.id,
                  label: contact.name
                }))}
              />
            </Form.Item>
            
            <Form.Item
              name="devisId"
              label="Devis associé (optionnel)"
            >
              <Select 
                placeholder={loadingDevis ? "Chargement des devis..." : "Sélectionner un devis"} 
                allowClear
                loading={loadingDevis}
                disabled={!selectedContact || loadingDevis}
                onChange={handleDevisChange}
                options={devisList.map(devis => ({
                  value: devis.id,
                  label: `${devis.reference || 'Sans référence'} - ${(devis.totalTTC ?? 0).toFixed(2)}€`
                }))}
              />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="invoiceDate"
              label="Date de la facture"
              rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
            >
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
            
            <Form.Item
              name="dueDate"
              label="Date d'échéance"
              rules={[{ required: true, message: 'Veuillez sélectionner une date d\'échéance' }]}
            >
              <DatePicker format="DD/MM/YYYY" className="w-full" />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="status"
              label="Statut de la facture"
              rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
            >
              <Select>
                {Object.entries(INVOICE_STATUSES).map(([key, { label }]) => (
                  <Select.Option key={key} value={key}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="paymentStatus"
              label="Statut du paiement"
              rules={[{ required: true, message: 'Veuillez sélectionner un statut de paiement' }]}
            >
              <Select>
                {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                  <Select.Option key={key} value={key}>
                    {label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="paymentMethod"
              label="Mode de paiement"
              rules={[{ required: true, message: 'Veuillez sélectionner un mode de paiement' }]}
            >
              <Select>
                {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                  <Select.Option key={key} value={value}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="paymentConditions"
              label="Conditions de paiement"
              rules={[{ required: true, message: 'Veuillez sélectionner les conditions de paiement' }]}
            >
              <Select>
                {PAYMENT_CONDITIONS.map((condition) => (
                  <Select.Option key={condition} value={condition}>
                    {condition}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="createEmptySection"
              label="Créer une section vide si aucune section n'est ajoutée"
            >
              <Select defaultValue={false}>
                <Select.Option value={false}>Non</Select.Option>
                <Select.Option value={true}>Oui</Select.Option>
              </Select>
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="autoliquidation"
              valuePropName="checked"
              label=" "
            >
              <Checkbox onChange={(e) => handleAutoliquidationChange(e.target.checked)}>
                Autoliquidation
              </Checkbox>
            </Form.Item>
            
            <Form.Item
              label="Facturer à"
              name="billToPrescriber"
              tooltip="Choisissez l'entité à qui la facture sera adressée"
            >
              <Radio.Group>
                <Radio value={false}>Client</Radio>
                <Radio value={true}>Prescripteur</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.billToPrescriber !== currentValues.billToPrescriber
              }
            >
              {({ getFieldValue }) => 
                !getFieldValue('billToPrescriber') && (
                  <Form.Item
                    name="hidePrescriber"
                    valuePropName="checked"
                    tooltip="Ne pas afficher les informations du prescripteur sur la facture"
                    label=" "
                  >
                    <Checkbox>Masquer le prescripteur</Checkbox>
                  </Form.Item>
                )
              }
            </Form.Item>
          </div>
          
          <Form.Item label=" " colon={false}>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Client:</strong> La facture sera adressée au client, le prescripteur sera mentionné comme référence.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Prescripteur:</strong> La facture sera adressée au prescripteur, le client sera mentionné comme projet.
              </p>
            </div>
          </Form.Item>
          
          <InvoiceEditor 
            sections={sections} 
            onSectionsChange={handleSectionsChange}
            clientId={selectedContact}
            autoliquidation={isAutoliquidation}
          />
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <RetentionGuaranteeForm
            totalHT={calculateTotals(sections, isAutoliquidation).originalTotalHT}
            hasRetention={hasRetention}
            onHasRetentionChange={setHasRetention}
            retentionData={retentionData}
            onRetentionChange={setRetentionData}
          />
          
          <div className="flex justify-end mt-6">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
            >
              Créer la facture
            </Button>
          </div>
        </Form>
      </Card>
      
      <Modal
        title="Utiliser les lignes du devis"
        open={isModalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
        okText="Oui, utiliser les lignes"
        cancelText="Non, créer une facture vide"
      >
        <p>Souhaitez-vous utiliser les lignes du devis sélectionné pour créer cette facture?</p>
        <p className="text-sm text-gray-500 mt-2">
          Si vous choisissez &quot;Oui&quot;, toutes les sections et prestations du devis seront ajoutées à la facture.
          <br />
          Si vous choisissez &quot;Non&quot;, la facture sera créée avec une référence au devis, mais sans aucune ligne.
        </p>
      </Modal>
    </div>
  );
} 
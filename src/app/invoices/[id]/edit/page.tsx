'use client';

import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, message, Spin, Checkbox, Radio, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { PAYMENT_METHODS, PAYMENT_CONDITIONS } from '@/types/payment';
import { INVOICE_STATUSES, PAYMENT_STATUSES } from '@/types/Invoice';
import InvoiceEditor from '@/components/InvoiceEditor';
import { v4 as uuidv4 } from 'uuid';
import RetentionGuaranteeForm from '@/components/RetentionGuaranteeForm';
import RetentionReleaseManager from '@/components/RetentionReleaseManager';

const { Title } = Typography;

// Ajouter des interfaces pour les types
interface InvoiceSection {
  id: string;
  name: string;
  subTotal: number;
  items: InvoiceItem[];
  isDirectMode?: boolean;
}

interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tva: number;
  amount: number;
  materials?: Material[];
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
  tva: number;
  billable?: boolean;
}

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [isAutoliquidation, setIsAutoliquidation] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [devis, setDevis] = useState<any>(null);
  const [devisLoadError, setDevisLoadError] = useState<string | null>(null);
  const [hasRetention, setHasRetention] = useState(false);
  const [retentionData, setRetentionData] = useState<any>(null);
  const [retentionReleases, setRetentionReleases] = useState<any[]>([]);
  const [prescriber, setPrescriber] = useState<any>(null);
  const router = useRouter();

  // Charger la facture
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        console.log("Chargement de la facture:", params.id);
        
        // Vérifier d'abord si la facture existe
        const checkResponse = await fetch(`/api/invoices/check?id=${params.id}`);
        const checkData = await checkResponse.json();
        
        if (!checkData.exists) {
          throw new Error(`La facture avec l'ID ${params.id} n'existe pas dans la base de données`);
        }
        
        const response = await fetch(`/api/invoices/${params.id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Réponse d'erreur:", response.status, errorData);
          throw new Error(`Erreur ${response.status}: ${errorData.error || 'Erreur inconnue'}`);
        }
        
        const data = await response.json();
        console.log("Données complètes reçues de l'API:", JSON.stringify(data, null, 2));
        
        // Vérifier que les données essentielles sont présentes
        if (!data.id || !data.clientId) {
          throw new Error("Les données de la facture sont incomplètes");
        }
        
        // Vérifier si les sections sont présentes et correctement structurées
        if (!data.sections || !Array.isArray(data.sections)) {
          console.warn("Les sections sont manquantes ou mal formatées:", data.sections);
          data.sections = [];
        } else {
          console.log("Sections reçues:", JSON.stringify(data.sections, null, 2));
        }
        
        // Formater correctement les sections pour l'éditeur
        const sectionsData = data.sections || [];
        
        // Transformer les données pour qu'elles soient compatibles avec InvoiceEditor
        const formattedSections = sectionsData.map((section: any) => {
          // Formater les éléments de chaque section
          const formattedItems = section.items.map((item: any) => {
            // Formater les matériaux de chaque élément
            const formattedMaterials = item.materials ? item.materials.map((material: any) => ({
              id: material.id,
              name: material.name,
              quantity: material.quantity,
              price: material.price,
              unit: material.unit || 'unité',
              reference: material.reference || '',
              tva: material.tva || 20
            })) : [];
            
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              quantity: item.quantity,
              unit: item.unit || 'unité',
              unitPrice: item.unitPrice,
              tva: item.tva,
              amount: item.amount || (item.quantity * item.unitPrice),
              materials: formattedMaterials
            };
          });
          
          return {
            id: section.id,
            name: section.name,
            subTotal: section.subTotal || formattedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
            items: formattedItems,
            isDirectMode: section.isDirectMode || false
          };
        });
        
        // Si aucune section n'est présente, créer une section par défaut en mode direct
        if (formattedSections.length === 0) {
          formattedSections.push({
            id: 'direct-items',
            name: '',
            subTotal: 0,
            items: [],
            isDirectMode: true
          });
        }
        
        // Déterminer si nous utilisons des sections ou non
        // Si la première section a isDirectMode = true, alors nous n'utilisons pas de sections
        const useSections = formattedSections.length > 0 ? !formattedSections[0].isDirectMode : false;
        
        // Stocker cette information dans l'objet invoice pour la transmettre au formulaire
        const invoiceWithMeta = {
          ...data,
          useSections: useSections
        };
        
        setInvoice(invoiceWithMeta);
        setSelectedContact(data.clientId);
        setSections(formattedSections);
        setIsAutoliquidation(data.autoliquidation || false);
        
        // Vérifier que les sections sont bien définies après l'affectation
        console.log("État des sections après affectation:", formattedSections);
        
        // Si un devis est associé, le charger
        if (data.devisId) {
          try {
            setDevisLoadError(null);
            console.log("Tentative de chargement du devis:", data.devisId);
            
            const devisResponse = await fetch(`/api/devis/${data.devisId}`);
            
            if (devisResponse.ok) {
              const devisData = await devisResponse.json();
              console.log("Données du devis reçues (COMPLÈTES):", JSON.stringify(devisData, null, 2));
              
              // Construire manuellement la référence si elle n'existe pas
              if (!devisData.reference && devisData.number && devisData.year) {
                devisData.reference = `DEVIS-${devisData.year}-${String(devisData.number).padStart(4, '0')}`;
                console.log("Référence générée:", devisData.reference);
              }
              
              setDevis(devisData);
            } else {
              console.error("Erreur lors du chargement du devis:", await devisResponse.text());
              setDevisLoadError("Impossible de charger les détails du devis");
            }
          } catch (error) {
            console.error('Erreur lors du chargement du devis associé:', error);
            setDevisLoadError("Erreur lors du chargement du devis");
          }
        }
        
        // Vérifier si la facture a une retenue de garantie
        try {
          console.log("Tentative de récupération de la retenue de garantie pour la facture:", params.id);
          
          // Utiliser le nouvel endpoint spécifique by-invoice
          const retentionResponse = await fetch(`/api/retention-guarantees/by-invoice/${params.id}`, {
            // Ajouter un cache: 'no-store' pour éviter les problèmes de cache
            cache: 'no-store',
            // Ajouter un timeout pour éviter les attentes trop longues
            signal: AbortSignal.timeout(5000) // 5 secondes de timeout
          });
          
          if (retentionResponse.ok) {
            const retentionData = await retentionResponse.json();
            console.log("Données de retenue reçues:", retentionData);
            
            if (retentionData && retentionData.length > 0) {
              const retention = retentionData[0];
              setHasRetention(true);
              setRetentionData({
                id: retention.id,
                rate: retention.rate,
                amount: retention.amount,
                releaseDate: retention.releaseDate,
                status: retention.status,
                notes: retention.notes
              });
              setRetentionReleases(retention.releases || []);
              console.log("Retenue de garantie trouvée et chargée:", retention.id);
            } else {
              console.log("Aucune retenue de garantie trouvée pour cette facture");
              setHasRetention(false);
              setRetentionData(null);
              setRetentionReleases([]);
            }
          } else {
            console.error("Erreur lors de la récupération de la retenue de garantie. Statut:", retentionResponse.status);
            try {
              const errorData = await retentionResponse.json();
              console.error("Détails de l'erreur:", errorData);
            } catch (parseError) {
              console.error("Impossible de parser la réponse d'erreur");
            }
            
            // Continuer sans retenue de garantie
            setHasRetention(false);
            setRetentionData(null);
            setRetentionReleases([]);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la retenue de garantie:', error);
          // Continuer sans retenue de garantie
          setHasRetention(false);
          setRetentionData(null);
          setRetentionReleases([]);
        }
        
        // Remplir le formulaire avec les données existantes
        form.setFieldsValue({
          clientId: data.clientId,
          devisId: data.devisId || '',
          invoiceDate: data.invoiceDate ? dayjs(data.invoiceDate) : undefined,
          dueDate: data.dueDate ? dayjs(data.dueDate) : undefined,
          paymentMethod: data.paymentMethod || '',
          paymentConditions: data.paymentConditions || '',
          status: data.status || 'DRAFT',
          paymentStatus: data.paymentStatus || 'UNPAID',
          notes: data.notes || '',
          autoliquidation: data.autoliquidation || false,
          billToPrescriber: data.billToPrescriber || false,
        });
      } catch (error) {
        console.error('Erreur détaillée:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        message.error(`Impossible de charger la facture: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id, form]);

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
  }, [setLoadingContacts, setContacts]);

  // Charger les informations du prescripteur lorsque le devis est chargé
  useEffect(() => {
    if (devis?.prescriberId) {
      const fetchPrescriber = async () => {
        try {
          const response = await fetch(`/api/prescribers/${devis.prescriberId}`);
          if (response.ok) {
            const data = await response.json();
            console.log("Données du prescripteur:", data);
            setPrescriber(data);
            
            // Appliquer les valeurs par défaut du prescripteur si la facture est nouvelle
            // ou si les valeurs n'ont pas été modifiées manuellement
            if (data) {
              // Vérifier si c'est une nouvelle facture ou si les valeurs n'ont pas été modifiées
              const isNewOrUnmodified = !invoice || 
                (invoice.autoliquidation === false && invoice.billToPrescriber === false);
                
              if (isNewOrUnmodified) {
                // Appliquer les valeurs par défaut du prescripteur
                if (data.defaultAutoliquidation) {
                  form.setFieldsValue({ autoliquidation: true });
                  handleAutoliquidationChange(true);
                }
                
                if (data.defaultBillToPrescriber) {
                  form.setFieldsValue({ billToPrescriber: true });
                  handleBillToPrescriberChange({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>);
                }
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement du prescripteur:", error);
        }
      };
      
      fetchPrescriber();
    }
  }, [devis, form, handleAutoliquidationChange, handleBillToPrescriberChange, invoice, setPrescriber]);

  // Ajouter un useEffect pour surveiller les changements de sections
  useEffect(() => {
    console.log("État actuel des sections:", sections);
  }, [sections]);

  const handleContactChange = (value: string) => {
    setSelectedContact(value);
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

  const handleAutoliquidationChange = useCallback((checked: boolean) => {
    setIsAutoliquidation(checked);
    form.setFieldsValue({ autoliquidation: checked });
    
    // Recalculer les totaux
    if (sections.length > 0) {
      const newTotals = calculateTotals(sections, checked);
      setTotals(newTotals);
    }
  }, [form, sections, calculateTotals]);

  // Gérer le changement de l'option "Facturer au prescripteur"
  const handleBillToPrescriberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    form.setFieldsValue({ billToPrescriber: checked });
  }, [form]);

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      
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
      
      // Calculer les totaux
      const { totalHT, totalTVA, totalTTC, originalTotalHT } = calculateTotals(sections, values.autoliquidation);
      
      // Préparer les données de retenue de garantie si nécessaire
      const retentionGuaranteeData = hasRetention && retentionData ? {
        id: retentionData.id,
        rate: retentionData.rate,
        amount: retentionData.amount,
        releaseDate: retentionData.releaseDate,
        status: retentionData.status || 'PENDING',
        notes: retentionData.notes,
        releases: retentionReleases
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
        hidePrescriber: values.hidePrescriber || false,
        notes: values.notes,
        sections: sectionsToSubmit,
        totalHT,
        totalTVA,
        totalTTC,
        retentionGuarantee: retentionGuaranteeData
      };
      
      console.log("Données de facture à mettre à jour:", invoiceData);
      
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error('Erreur lors de la mise à jour de la facture');
      }
      
      const updatedInvoice = await response.json();
      message.success('Facture mise à jour avec succès');
      router.push(`/invoices/${params.id}`);
    } catch (error) {
      console.error('Erreur complète:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la facture');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card title="Modifier la facture" className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            createEmptySection: true,
            autoliquidation: false,
            billToPrescriber: invoice?.billToPrescriber || false,
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
                disabled={true} // Désactiver le changement de client
              >
                {contacts.map(client => (
                  <Select.Option key={client.id} value={client.id}>
                    {client.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="devisId"
              label="Devis associé"
            >
              {invoice?.devisId ? (
                devis ? (
                  <Input 
                    disabled={true} 
                    value={
                      devis.reference || 
                      (devis.number && devis.year ? 
                        `DEVIS-${devis.year}-${String(devis.number).padStart(4, '0')}` : 
                        'Devis sans référence')
                    } 
                  />
                ) : devisLoadError ? (
                  <div>
                    <p className="text-red-500 text-sm">Impossible de charger les détails du devis</p>
                    <Input disabled={true} value={invoice.devisId} />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Spin size="small" className="mr-2" />
                    <span>Chargement du devis...</span>
                  </div>
                )
              ) : (
                <Input disabled={true} placeholder="Aucun devis associé" />
              )}
            </Form.Item>
            
            <Form.Item
              name="invoiceDate"
              label="Date de facturation"
              rules={[{ required: true, message: 'Veuillez sélectionner une date de facturation' }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            
            <Form.Item
              name="dueDate"
              label="Date d'échéance"
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
              <Radio.Group onChange={handleBillToPrescriberChange}>
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
            initialUseSections={invoice?.useSections}
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
          
          {hasRetention && retentionData && retentionData.id && (
            <RetentionReleaseManager
              retentionId={retentionData.id}
              totalAmount={retentionData.amount}
              releases={retentionReleases}
              onReleasesChange={setRetentionReleases}
            />
          )}
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={() => router.push(`/invoices/${params.id}`)}
              className="mr-2"
            >
              Annuler
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              size="large"
            >
              Mettre à jour la facture
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
} 
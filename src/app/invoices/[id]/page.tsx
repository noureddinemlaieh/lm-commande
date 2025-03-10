'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Spin, message, Descriptions, Tag, Table, Divider, Modal, Typography, Select } from 'antd';
import { PrinterOutlined, EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES } from '@/types/Invoice';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { InvoicePDF } from '@/components/InvoicePDF';
import { numberToWords } from '@/utils/numberToWords';
import RetentionReleaseManager from '@/components/RetentionReleaseManager';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [retention, setRetention] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const router = useRouter();

  // Vérifier si on doit imprimer automatiquement
  useEffect(() => {
    // Vérifier si l'URL contient le paramètre print=true
    const urlParams = new URLSearchParams(window.location.search);
    const shouldPrint = urlParams.get('print') === 'true';
    
    if (shouldPrint && invoice && !loading) {
      // Lancer l'impression automatiquement après le chargement
      handlePrintPDF();
    }
  }, [invoice, loading]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        console.log("Chargement de la facture:", params.id);
        
        // Vérifier que l'ID est valide
        if (!params.id) {
          throw new Error("ID de facture invalide");
        }
        
        try {
          const response = await fetch(`/api/invoices/${params.id}`);
          
          console.log("Statut de la réponse:", response.status);
          
          if (!response.ok) {
            // Essayer de lire le corps de l'erreur si possible
            let errorMessage = `Erreur serveur: ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData && errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (e) {
              // Ignorer les erreurs lors de la lecture du corps de l'erreur
            }
            
            console.error("Erreur API:", response.status, errorMessage);
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          console.log("Données reçues:", data);
          
          // Déboguer les informations du client et du prescripteur
          console.log("Client:", data.client);
          console.log("Prescripteur du client:", data.client?.prescriber);
          console.log("Facturer au prescripteur:", data.billToPrescriber);
          console.log("Devis d'origine:", data.devis);
          
          // Vérifier que les données essentielles sont présentes
          if (!data) {
            throw new Error("Aucune donnée reçue");
          }
          
          if (!data.id) {
            throw new Error("Les données de la facture sont incomplètes");
          }
          
          // S'assurer que les sections existent
          if (!data.sections) {
            data.sections = [];
          }
          
          // S'assurer que le contact existe
          if (!data.contact) {
            data.contact = { name: "Contact inconnu" };
          }
          
          setInvoice(data);
        } catch (fetchError) {
          console.error("Erreur lors de la requête:", fetchError);
          throw fetchError;
        }

        // Charger la retenue de garantie si elle existe
        try {
          const retentionResponse = await fetch(`/api/retention-guarantees/by-invoice/${params.id}`);
          if (retentionResponse.ok) {
            const retentionData = await retentionResponse.json();
            if (retentionData && Array.isArray(retentionData) && retentionData.length > 0) {
              setRetention(retentionData[0]);
              console.log("Données de retenue chargées avec succès:", retentionData[0]);
            } else {
              console.log("Aucune retenue trouvée pour cette facture");
            }
          } else {
            console.error("Erreur lors de la récupération de la retenue:", retentionResponse.status);
          }
        } catch (error) {
          console.error('Erreur détaillée lors du chargement de la retenue de garantie:', error);
        }
      } catch (error) {
        console.error('Erreur détaillée:', error);
        message.error(`Impossible de charger la facture: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  // Charger le logo en base64
  useEffect(() => {
    const getBase64Logo = async () => {
      try {
        const response = await fetch('/images/logo.png');
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Erreur lors du chargement du logo:', error);
        return null;
      }
    };

    getBase64Logo().then(base64 => setLogoBase64(base64));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Chargement de la facture...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Facture non trouvée</h2>
          <p className="text-gray-600 mb-6">
            Impossible de charger les détails de cette facture. Elle n'existe peut-être pas ou a été supprimée.
          </p>
          <Button 
            onClick={() => router.push('/invoices')} 
            icon={<ArrowLeftOutlined />}
            size="large"
          >
            Retour à la liste des factures
          </Button>
        </div>
      </div>
    );
  }

  const companyInfo = {
    name: "Votre Entreprise",
    address: "123 Rue du Commerce, 75001 Paris",
    logo: logoBase64 || "/images/logo.png",
    legalInfo: "SIRET: 123 456 789 00001 - TVA: FR12345678900",
    bankInfo: "IBAN: FR76 1234 5678 9012 3456 7890 123 - BIC: ABCDEFGH"
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handlePrintPDF = () => {
    if (!invoice) return;
    
    try {
      // Préparer les données pour le PDF
      const invoiceWithRetention = {
        ...invoice,
        retentionGuarantee: retention
      };
      
      console.log("Données préparées pour le PDF:", invoiceWithRetention);
      setShowPdfPreview(true);
    } catch (error) {
      console.error("Erreur lors de la préparation du PDF:", error);
      message.error("Impossible de générer le PDF");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    
    try {
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/invoices/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      
      const updatedInvoice = await response.json();
      
      // Mettre à jour l'état local
      setInvoice({ ...invoice, status: newStatus });
      
      message.success(`Statut de la facture mis à jour: ${INVOICE_STATUSES[newStatus as keyof typeof INVOICE_STATUSES]?.label || newStatus}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la mise à jour du statut de la facture');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    
    try {
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/invoices/${params.id}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut de paiement');
      
      const updatedInvoice = await response.json();
      
      // Mettre à jour l'état local
      setInvoice({ ...invoice, paymentStatus: newStatus });
      
      message.success(`Statut de paiement mis à jour: ${PAYMENT_STATUSES[newStatus as keyof typeof PAYMENT_STATUSES]?.label || newStatus}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la mise à jour du statut de paiement');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          onClick={() => router.push('/invoices')} 
          icon={<ArrowLeftOutlined />}
        >
          Retour
        </Button>
        <div className="flex gap-2">
          <Button 
            icon={<EditOutlined />}
            onClick={() => router.push(`/invoices/${params.id}/edit`)}
          >
            Modifier
          </Button>
          <Button 
            type="primary" 
            icon={<PrinterOutlined />}
            onClick={handlePrintPDF}
          >
            Imprimer
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Facture {invoice.reference}</h1>
            <p className="text-gray-500">
              Créée le {formatDate(invoice.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Statut:</span>
              <Select
                value={invoice.status}
                style={{ width: 140 }}
                onChange={handleStatusChange}
                loading={updatingStatus}
                disabled={updatingStatus}
              >
                {Object.entries(INVOICE_STATUSES).map(([key, { label, color }]) => (
                  <Select.Option key={key} value={key}>
                    <Tag color={color}>{label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Paiement:</span>
              <Select
                value={invoice.paymentStatus}
                style={{ width: 180 }}
                onChange={handlePaymentStatusChange}
                loading={updatingStatus}
                disabled={updatingStatus}
              >
                {Object.entries(PAYMENT_STATUSES).map(([key, { label, color }]) => (
                  <Select.Option key={key} value={key}>
                    <Tag color={color}>{label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <Divider />

        <Descriptions title="Informations" layout="vertical" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Client">{invoice.client?.name}</Descriptions.Item>
          <Descriptions.Item label="Date d'échéance">{formatDate(invoice.dueDate)}</Descriptions.Item>
          <Descriptions.Item label="Mode de paiement">{invoice.paymentMethod || 'Non spécifié'}</Descriptions.Item>
          <Descriptions.Item label="Conditions de paiement">{invoice.paymentConditions || 'Non spécifiées'}</Descriptions.Item>
          {invoice.devis && (
            <Descriptions.Item label="Devis de référence">{invoice.devis.reference}</Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        <h2 className="text-xl font-semibold mb-4">Détails de la facture</h2>

        {invoice.sections.map((section, index) => (
          <div key={section.id} className="mb-6">
            <h3 className="text-lg font-medium mb-2">{section.name}</h3>
            <Table 
              dataSource={section.items} 
              rowKey="id"
              pagination={false}
              className="mb-4"
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'name',
                  key: 'name',
                  width: '40%',
                },
                {
                  title: 'Quantité',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center',
                  width: '10%',
                  render: (quantity: number, record) => `${quantity} ${record.unit}`,
                },
                {
                  title: 'Prix unitaire',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  align: 'right',
                  width: '15%',
                  render: (price: number) => `${price.toFixed(2)} €`,
                },
                {
                  title: 'TVA',
                  dataIndex: 'tva',
                  key: 'tva',
                  align: 'center',
                  width: '10%',
                  render: (tva: number) => `${tva}%`,
                },
                {
                  title: 'Total HT',
                  dataIndex: 'amount',
                  key: 'amount',
                  align: 'right',
                  width: '15%',
                  render: (amount: number) => `${amount.toFixed(2)} €`,
                },
              ]}
              expandable={{
                expandedRowRender: record => (
                  <div className="p-4 bg-gray-50">
                    {record.description && (
                      <p className="mb-2">{record.description}</p>
                    )}
                    {record.materials && record.materials.length > 0 && (
                      <Table 
                        dataSource={record.materials}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Matériau',
                            dataIndex: 'name',
                            key: 'name',
                            width: '40%',
                          },
                          {
                            title: 'Référence',
                            dataIndex: 'reference',
                            key: 'reference',
                            width: '15%',
                          },
                          {
                            title: 'Quantité',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            align: 'center',
                            width: '10%',
                            render: (quantity: number, record) => `${quantity} ${record.unit}`,
                          },
                          {
                            title: 'Prix unitaire',
                            dataIndex: 'price',
                            key: 'price',
                            align: 'right',
                            width: '15%',
                            render: (price: number) => `${price.toFixed(2)} €`,
                          },
                          {
                            title: 'TVA',
                            dataIndex: 'tva',
                            key: 'tva',
                            align: 'center',
                            width: '10%',
                            render: (tva: number) => `${tva}%`,
                          },
                          {
                            title: 'Total HT',
                            key: 'total',
                            align: 'right',
                            width: '15%',
                            render: (_, record) => `${(record.quantity * record.price).toFixed(2)} €`,
                          },
                        ]}
                      />
                    )}
                  </div>
                ),
              }}
            />
          </div>
        ))}

        <Divider />

        <div className="flex justify-end">
          <div className="w-96">
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span>Total HT:</span>
                <span>{invoice.totalHT.toFixed(2)} €</span>
              </div>
              
              {/* Afficher la TVA et le total TTC uniquement si pas d'autoliquidation */}
              {!invoice.autoliquidation && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span>TVA:</span>
                    <span>{invoice.totalTVA.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between items-center font-bold border-t pt-2 mb-2">
                    <span>Total TTC:</span>
                    <span>{invoice.totalTTC.toFixed(2)} €</span>
                  </div>
                </>
              )}
              
              {/* Montant en lettres - adapté selon autoliquidation */}
              <div className="text-sm italic mt-2 mb-2">
                Soit {numberToWords(invoice.autoliquidation ? invoice.totalHT : invoice.totalTTC)}
              </div>
              
              {/* Mention d'autoliquidation */}
              {invoice.autoliquidation && (
                <div className="bg-gray-100 text-sm italic p-2 mt-2">
                  Autoliquidation – Article 283 – 2 nonies du CGI
                </div>
              )}
            </div>
          </div>
        </div>

        {invoice.notes && (
          <>
            <Divider />
            <div>
              <h3 className="text-lg font-medium mb-2">Notes</h3>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          </>
        )}
      </Card>

      {/* Afficher les informations de retenue de garantie si elle existe */}
      {retention && (
        <Card title="Retenue de garantie" style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <Text strong>Taux de retenue:</Text>
                <Text style={{ marginLeft: 8 }}>{retention.rate} %</Text>
              </div>
              <div>
                <Text strong>Montant de la retenue:</Text>
                <Text style={{ marginLeft: 8 }}>{retention.amount.toFixed(2)} €</Text>
              </div>
              <div>
                <Text strong>Date de libération prévue:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {retention.releaseDate ? dayjs(retention.releaseDate).format('DD/MM/YYYY') : 'Non définie'}
                </Text>
              </div>
              <div>
                <Text strong>Statut:</Text>
                <Tag 
                  color={
                    retention.status === 'RELEASED' ? 'green' : 
                    retention.status === 'PARTIAL' ? 'blue' : 'orange'
                  }
                  style={{ marginLeft: 8 }}
                >
                  {retention.status === 'RELEASED' ? 'Libérée' : 
                   retention.status === 'PARTIAL' ? 'Partiellement libérée' : 'En attente'}
                </Tag>
              </div>
            </div>
            
            {retention.notes && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Notes:</Text>
                <Text style={{ marginLeft: 8 }}>{retention.notes}</Text>
              </div>
            )}
          </div>
          
          <Divider />
          
          <RetentionReleaseManager
            retentionId={retention.id}
            totalAmount={retention.amount}
            releases={retention.releases || []}
            onReleasesChange={() => {}}
            readOnly={true}
          />
        </Card>
      )}

      {/* Modal pour l'aperçu PDF */}
      {showPdfPreview && invoice && (
        <Modal
          title="Aperçu PDF"
          open={showPdfPreview}
          onCancel={() => setShowPdfPreview(false)}
          width="80%"
          footer={[
            <Button key="close" onClick={() => setShowPdfPreview(false)}>
              Fermer
            </Button>,
            <Button key="print" type="primary" onClick={() => window.print()}>
              Imprimer
            </Button>
          ]}
        >
          <div className="pdf-preview">
            {(() => {
              try {
                return (
                  <PDFViewer width="100%" height="600px">
                    <InvoicePDF 
                      invoice={{
                        ...invoice,
                        retentionGuarantee: retention,
                        devis: invoice.devis
                      } as any}
                      contact={invoice.client}
                      billToPrescriber={invoice.billToPrescriber || false}
                      company={{
                        name: "LM COMMANDE",
                        address: "5 Avenue Ingres",
                        postalCode: "75016",
                        city: "Paris",
                        siret: "892 278 193 00016",
                        tva: "FR 90 892278193",
                        logo: logoBase64 || undefined,
                        legalInfo: "SARL au capital de 1000€ - RCS Paris 892 278 193 - APE 4399C",
                        bankInfo: "IBAN: FR76 3000 4028 3700 0108 4548 294 - BIC: BNPAFRPPXXX"
                      }}
                    />
                  </PDFViewer>
                );
              } catch (error) {
                console.error("Erreur lors du rendu du PDF:", error);
                return (
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ color: 'red' }}>Impossible d'afficher l'aperçu PDF. Erreur: {String(error)}</p>
                  </div>
                );
              }
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
} 
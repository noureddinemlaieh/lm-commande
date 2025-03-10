import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Invoice } from '@/types/Invoice';
import { Client } from '@/types/Client';
import { Prescriber as TypedPrescriber } from '@/types/Prescriber';
import { numberToWords } from '@/utils/numberToWords';
import { Devis } from '@/types/Devis';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';

// Utiliser les polices par défaut de react-pdf
// Pas besoin d'enregistrer des polices externes

// Styles
const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333'
  },
  headerContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  logoAndInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
    marginBottom: 0,
    top: -15,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: '100%',
    marginTop: -15,
    marginBottom: 0,
    position: 'relative'
  },
  companyInfo: {
    fontSize: 10,
    color: '#000000',
    marginTop: 2
  },
  header: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  clientSection: {
    width: '50%',
    paddingLeft: 100,
  },
  projectSection: {
    width: '50%',
    paddingLeft: 50
  },
  sectionTitle: {
    color: '#D35C37', // Couleur orange exacte du devis
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica',
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#D35C37'
  },
  reference: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center'
  },
  devisInfo: {
    marginTop: 20,
    marginBottom: 10
  },
  devisInfoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  devisInfoGroup: {
    flexDirection: 'column',
  },
  devisInfoLabel: {
    fontSize: 10,
    marginBottom: 5,
    marginRight: 100,
  },
  devisInfoValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 5
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  enteteDevis: {
    width: '55%',
    color: '#000080', // Bleu marine pour les en-têtes
    fontWeight: 'bold',
    fontSize: 10,
  },
  descriptionCol: {
    width: '55%',
  
    fontWeight: 'bold',
    fontSize: 10,
  },
  quantityCol: {
    width: '12%',
    textAlign: 'right',
    fontSize: 10,
    paddingRight: 5,
    fontWeight: 'bold',
  },
  priceCol: {
    width: '10%',
    textAlign: 'right',
    fontSize: 10,
    paddingRight: 5,
    fontWeight: 'bold',
  },
  tvaCol: {
    width: '10%',
    textAlign: 'right',
    fontSize: 10,
    paddingRight: 5,
    fontWeight: 'bold',
  },
  totalCol: {
    width: '13%',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionName: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 0,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#973C39', // Rouge bordeaux pour les noms de section
    marginBottom: 8,
  },
  prestationContainer: {
    marginLeft: 0,
    paddingLeft: 8,
    marginBottom: 10,
  },
  prestationDescription: {
    paddingLeft: 10,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 9,
    fontStyle: 'italic',
    color: '#666666',
  },
  totalsContainer: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#666',
  },
  totalLabel: {
    fontSize: 10,
    color: '#D35C37', // Bleu marine pour les labels de totaux
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#000080',
  },
  totalTTCLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D35C37', // Orange pour le total TTC
  },
  totalTTCValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentMethodRow: {
    marginTop: 10,
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: 'black',
  },
  paymentMethodText: {
    fontSize: 9,
    color: 'black',
  },
  autoliquidation: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f5f5f5'
  },
  autoliquidationText: {
    fontSize: 9,
    color: '#666'
  },
  amountInWords: {
    marginTop: 10,
    marginBottom: 10,
    padding: 5,
  },
  amountInWordsText: {
    fontSize: 9,
    color: '#666'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 8,
    textAlign: 'center',
    color: '#666'
  },
  notes: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  paymentInfo: {
    marginTop: 20,
    marginBottom: 20
  },
  paymentTitle: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  clientName: {
    fontWeight: 'bold',
  },
  serviceTitle: {
    position: 'absolute',
    right: 0,
    top: 8
  },
  serviceTitleText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  retentionInfo: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f5f5f5'
  },
  retentionText: {
    fontSize: 9,
    color: '#666'
  },
});

// Définir l'interface pour les propriétés de l'entreprise
interface CompanyInfo {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string;
  tva: string;
  logo?: string;
  legalInfo?: string;
  bankInfo?: string;
}

// Définir une interface pour les informations du client
interface ClientInfo {
  name?: string;
  company?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
}

// Définir une interface pour le prescripteur locale pour le PDF
interface LocalPrescriber {
  id?: string;
  nom?: string;
  rue?: string;
  cp?: string;
  ville?: string;
  pays?: string;
  tel1?: string;
  mail1?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Définir une interface pour la retenue de garantie
interface RetentionGuarantee {
  id?: string;
  rate: number;
  amount: number;
  releaseDate?: string;
  status: string;
  notes?: string;
}

// Définir une interface locale pour Contact dans le contexte du PDF
interface LocalContact {
  id?: string;
  nom?: string;
  rue?: string;
  cp?: string;
  ville?: string;
  pays?: string;
  tel1?: string;
  mail1?: string;
  prescriber?: LocalPrescriber;
  [key: string]: any;
}

// Définir une interface locale pour Invoice dans le contexte du PDF
interface LocalInvoice extends Omit<Invoice, 'contact'> {
  contact?: LocalContact;
  hidePrescriber?: boolean;
  retentionGuarantee?: RetentionGuarantee;
  devis?: {
    id: string;
    reference: string;
    [key: string]: any;
  };
}

// Mettre à jour l'interface InvoicePDFProps
interface InvoicePDFProps {
  invoice: Invoice;
  contact?: Client;
  company: CompanyInfo;
  billToPrescriber?: boolean;
}

export const InvoicePDF = ({ invoice, contact, company, billToPrescriber = false }: InvoicePDFProps) => {
  // Utiliser le type local pour l'invoice
  const typedInvoice = invoice as unknown as LocalInvoice;
  
  // Formatage des dates et nombres
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return '';
    }
  };
  
  const formatNumber = (num: number) => {
    if (typeof num !== 'number') return '0,00';
    try {
      return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (error) {
      console.error("Erreur de formatage de nombre:", error);
      return '0,00';
    }
  };
  
  // Extraire les sections de la facture
  const sections = typedInvoice.sections || [];
  
  // Extraire les informations du client et du prescripteur
  // Utiliser les données passées en paramètre ou celles de la facture
  const clientInfo = contact || typedInvoice.client || {};
  const prescriberInfo = clientInfo.prescriber || {};
  const hidePrescriber = typedInvoice.hidePrescriber || false;
  
  // Extraire les informations de retenue de garantie
  const retentionGuarantee = typedInvoice.retentionGuarantee || null;
  
  // Déterminer qui est le client et qui est le projet en fonction de billToPrescriber
  const displayedClientInfo = billToPrescriber ? prescriberInfo : clientInfo;
  const displayedProjectInfo = billToPrescriber ? clientInfo : prescriberInfo;
  
  console.log("Données du PDF:", {
    invoice: typedInvoice,
    contact,
    clientInfo,
    prescriberInfo,
    billToPrescriber,
    hidePrescriber,
    devis: typedInvoice.devis
  });
  
  try {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
         {/* En-tête avec logo */}
         <PDFHeader 
           address={company.address || '5 Avenue Ingres'}
           postalCode={company.postalCode || '75016'}
           city={company.city || 'Paris France'}
           siret={company.siret || '892 278 193 00016'}
           decennale="146979536"
           logoPath={company.logo || '/images/logo.png'}
           slogan="Au service de l'habitat"
         />
          
          {/* Informations client et prescripteur/projet */}
          <View style={styles.header}>
            <View style={styles.clientSection}>
              <Text style={styles.sectionTitle}>Client</Text>
              {/* Afficher les informations du client (qui peut être le prescripteur si billToPrescriber=true) */}
              {billToPrescriber ? (
                // Si on facture le prescripteur, afficher ses informations comme client
                prescriberInfo && (
                  <>
                    <Text style={styles.clientName}>{prescriberInfo.nom || prescriberInfo.name || 'Prescripteur non spécifié'}</Text>
                    {(prescriberInfo.rue || prescriberInfo.address) && <Text>{prescriberInfo.rue || prescriberInfo.address}</Text>}
                    {((prescriberInfo.cp && prescriberInfo.ville) || (prescriberInfo.postalCode && prescriberInfo.city)) && (
                      <Text>{prescriberInfo.cp || prescriberInfo.postalCode} {prescriberInfo.ville || prescriberInfo.city}</Text>
                    )}
                    {(prescriberInfo.pays || prescriberInfo.country) && <Text>{prescriberInfo.pays || prescriberInfo.country}</Text>}
                    {(prescriberInfo.tel1 || prescriberInfo.phone) && <Text>Tél: {prescriberInfo.tel1 || prescriberInfo.phone}</Text>}
                    {(prescriberInfo.mail1 || prescriberInfo.email) && <Text>Email: {prescriberInfo.mail1 || prescriberInfo.email}</Text>}
                  </>
                )
              ) : (
                // Sinon, afficher les informations du client
                clientInfo && (
                  <>
                    <Text style={styles.clientName}>{clientInfo.name || clientInfo.nom || 'Client non spécifié'}</Text>
                    {(typeof clientInfo.company === 'string' || typeof clientInfo.company === 'object') && <Text>{clientInfo.company}</Text>}
                    {(clientInfo.address || clientInfo.rue) && <Text>{clientInfo.address || clientInfo.rue}</Text>}
                    {((clientInfo.postalCode && clientInfo.city) || (clientInfo.cp && clientInfo.ville)) && (
                      <Text>{clientInfo.postalCode || clientInfo.cp} {clientInfo.city || clientInfo.ville}</Text>
                    )}
                    {(clientInfo.country || clientInfo.pays) && <Text>{clientInfo.country || clientInfo.pays}</Text>}
                    {(clientInfo.email || clientInfo.mail1) && <Text>Email: {clientInfo.email || clientInfo.mail1}</Text>}
                    {(clientInfo.phone || clientInfo.tel1) && <Text>Tél: {clientInfo.phone || clientInfo.tel1}</Text>}
                  </>
                )
              )}
            </View>
            
            {/* Afficher la section prescripteur uniquement si nécessaire */}
            {(!billToPrescriber && !hidePrescriber) && (
              <View style={styles.projectSection}>
                <Text style={styles.sectionTitle}>Prescripteur</Text>
                {prescriberInfo && (
                  <>
                    <Text style={styles.clientName}>{prescriberInfo.nom || prescriberInfo.name || 'Prescripteur non spécifié'}</Text>
                    {(prescriberInfo.rue || prescriberInfo.address) && <Text>{prescriberInfo.rue || prescriberInfo.address}</Text>}
                    {((prescriberInfo.cp && prescriberInfo.ville) || (prescriberInfo.postalCode && prescriberInfo.city)) && (
                      <Text>{prescriberInfo.cp || prescriberInfo.postalCode} {prescriberInfo.ville || prescriberInfo.city}</Text>
                    )}
                    {(prescriberInfo.pays || prescriberInfo.country) && <Text>{prescriberInfo.pays || prescriberInfo.country}</Text>}
                    {(prescriberInfo.tel1 || prescriberInfo.phone) && <Text>Tél: {prescriberInfo.tel1 || prescriberInfo.phone}</Text>}
                    {(prescriberInfo.mail1 || prescriberInfo.email) && <Text>Email: {prescriberInfo.mail1 || prescriberInfo.email}</Text>}
                  </>
                )}
              </View>
            )}
            
            {/* Si on facture le prescripteur, toujours afficher le client comme projet */}
            {billToPrescriber && (
              <View style={styles.projectSection}>
                <Text style={styles.sectionTitle}>Projet</Text>
                {clientInfo && (
                  <>
                    <Text style={styles.clientName}>{clientInfo.name || clientInfo.nom || 'Client non spécifié'}</Text>
                    {(typeof clientInfo.company === 'string' || typeof clientInfo.company === 'object') && <Text>{clientInfo.company}</Text>}
                    {(clientInfo.address || clientInfo.rue) && <Text>{clientInfo.address || clientInfo.rue}</Text>}
                    {((clientInfo.postalCode && clientInfo.city) || (clientInfo.cp && clientInfo.ville)) && (
                      <Text>{clientInfo.postalCode || clientInfo.cp} {clientInfo.city || clientInfo.ville}</Text>
                    )}
                    {(clientInfo.country || clientInfo.pays) && <Text>{clientInfo.country || clientInfo.pays}</Text>}
                    {(clientInfo.email || clientInfo.mail1) && <Text>Email: {clientInfo.email || clientInfo.mail1}</Text>}
                    {(clientInfo.phone || clientInfo.tel1) && <Text>Tél: {clientInfo.phone || clientInfo.tel1}</Text>}
                  </>
                )}
              </View>
            )}
          </View>
          
          {/* Titre et référence */}
          <Text style={styles.title}>Facture N° : {typedInvoice.reference}</Text>
          
          {/* Informations de la facture */}
          <View style={styles.devisInfo}>
            <View style={styles.devisInfoRow}>
              <View style={styles.devisInfoGroup}>
                <Text style={styles.devisInfoLabel}>Date d&apos;émission:</Text>
                <Text style={styles.devisInfoValue}>{formatDate(typedInvoice.createdAt)}</Text>
              </View>
              
              {/* Ajouter le numéro de devis d'origine */}
              {typedInvoice.devis && (
                <View style={styles.devisInfoGroup}>
                  <Text style={styles.devisInfoLabel}>Devis d&apos;origine:</Text>
                  <Text style={styles.devisInfoValue}>{typedInvoice.devis.reference || 'Non spécifié'}</Text>
                </View>
              )}
              
              <View style={styles.devisInfoGroup}>
                <Text style={styles.devisInfoLabel}>Date d&apos;échéance:</Text>
                <Text style={styles.devisInfoValue}>{typedInvoice.dueDate ? formatDate(typedInvoice.dueDate) : 'Non spécifiée'}</Text>
              </View>
            </View>
          </View>
          
          {/* Contenu de la facture */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.enteteDevis, {color: 'black'}]}>Description</Text> 
              <Text style={styles.quantityCol}>Quantité</Text>
              <Text style={styles.priceCol}>P.U</Text>
              <Text style={styles.tvaCol}>TVA</Text>
              <Text style={styles.totalCol}>Montant</Text>
            </View>
            
            {sections.map((section, sectionIndex) => (
              !(section as any).hidden ? (
                <View key={section.id}>
                  <Text style={styles.sectionName}>{section.name}</Text>
                  
                  {section.items.map((item) => (
                    <View key={item.id} style={styles.prestationContainer}>
                      <View style={styles.tableRow}>
                        <Text style={styles.descriptionCol}>
                          {item.name}
                          {item.description && (
                            <Text style={styles.prestationDescription}>
                              {"\n"}{item.description}
                            </Text>
                          )}
                        </Text>
                        <Text style={styles.quantityCol}>
                          {formatNumber(item.quantity)} {item.unit}
                        </Text>
                        <Text style={styles.priceCol}>
                          {formatNumber(item.unitPrice)} €
                        </Text>
                        <Text style={styles.tvaCol}>
                          {item.tva}%
                        </Text>
                        <Text style={styles.totalCol}>
                          {formatNumber(item.amount)} €
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null
            ))}
          </View>
          
          {/* Totaux */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT:</Text>
              <Text style={styles.totalValue}>{formatNumber(typedInvoice.totalHT)} €</Text>
            </View>
            
            {/* Afficher la retenue de garantie si elle existe */}
            {retentionGuarantee && retentionGuarantee.rate && retentionGuarantee.amount && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Retenue de garantie ({retentionGuarantee.rate}%):</Text>
                  <Text style={styles.totalValue}>-{formatNumber(retentionGuarantee.amount)} €</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total HT après retenue:</Text>
                  <Text style={styles.totalValue}>{formatNumber(typedInvoice.totalHT)} €</Text>
                </View>
              </>
            )}
            
            {/* Afficher la TVA et le total TTC uniquement si pas d'autoliquidation */}
            {!typedInvoice.autoliquidation && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TVA:</Text>
                  <Text style={styles.totalValue}>{formatNumber(typedInvoice.totalTVA)} €</Text>
                </View>
                <View style={styles.totalTTCRow}>
                  <Text style={styles.totalTTCLabel}>Total TTC:</Text>
                  <Text style={styles.totalTTCValue}>{formatNumber(typedInvoice.totalTTC)} €</Text>
                </View>
              </>
            )}
            
            {/* Montant en lettres - adapté selon autoliquidation */}
            <View style={styles.amountInWords}>
              <Text style={styles.amountInWordsText}>
                Soit {numberToWords(typedInvoice.autoliquidation ? typedInvoice.totalHT : typedInvoice.totalTTC)}
              </Text>
            </View>
            
            {/* Mention d'autoliquidation */}
            {typedInvoice.autoliquidation && (
              <View style={styles.autoliquidation}>
                <Text style={styles.autoliquidationText}>
                  Autoliquidation – Article 283 – 2 nonies du CGI
                </Text>
              </View>
            )}
            
            {/* Informations sur la retenue de garantie */}
            {retentionGuarantee && retentionGuarantee.rate && retentionGuarantee.amount && (
              <View style={styles.retentionInfo}>
                <Text style={styles.retentionText}>
                  Une retenue de garantie de {retentionGuarantee.rate}% a été appliquée sur cette facture.
                  {retentionGuarantee.releaseDate ? ` Date de libération prévue: ${formatDate(retentionGuarantee.releaseDate)}.` : ''}
                  {retentionGuarantee.notes ? ` ${retentionGuarantee.notes}` : ''}
                </Text>
              </View>
            )}
            
            {/* Mode de paiement */}
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodText}>
                Mode de paiement : {typedInvoice.paymentMethod || 'Non spécifié'}
              </Text>
              <Text style={styles.paymentMethodText}>
                Conditions de paiement : {typedInvoice.paymentConditions}
              </Text>
            </View>
          </View>
          
          {/* Informations de paiement */}
          {company.bankInfo && (
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Informations de paiement:</Text>
              <Text>{company.bankInfo}</Text>
            </View>
          )}
          
          {/* Notes */}
          {typedInvoice.notes && (
            <View style={styles.notes}>
              <Text style={styles.paymentTitle}>Notes:</Text>
              <Text>{typedInvoice.notes}</Text>
            </View>
          )}
          
          {/* Pied de page */}
          <PDFFooter pageNumber={1} totalPages={1} website="www.bravotravo.com" />
        </Page>
      </Document>
    );
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Une erreur est survenue lors de la génération de la facture</Text>
        </Page>
      </Document>
    );
  }
}; 
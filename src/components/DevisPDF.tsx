import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFComments } from './PDFComments';

// Enregistrer les polices Roboto pour react-pdf
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1MmgVxIIzI.ttf',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 700,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1Mu51TzBic6CsE.ttf',
      fontWeight: 700,
      fontStyle: 'italic',
    }
  ],
});

interface DevisPDFProps {
  devisNumber: string;
  expirationDate?: string;
  paymentMethod?: string;
  pilot?: string;
  phone?: string;
  email?: string;
  sections: Array<{
    id: string;
    name: string;
    subTotal: number;
    materialsTotal: number;
    prestations: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      tva: number;
      description?: string;
      materials: Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        price: number;
        reference?: string;
        tva?: number;
      }>;
    }>;
  }>;
  totals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    services: {
      tvaDetails: Array<{ taux: number; tva: number }>;
    };
  };
  contact?: {
    name: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    prescriber?: {
      nom?: string;
      rue?: string;
      cp?: string;
      ville?: string;
      pays?: string;
    };
  };
  company: {
    name: string;
    address: string;
    logo: string;
    postalCode?: string;
    city?: string;
    siret?: string;
  };
  showMaterials?: boolean;
  devisComments?: string;
  showDevisComments?: boolean;
  showDescriptions?: boolean;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  reference?: string;
  tva?: number;
}

const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontSize: 10,
    fontFamily: 'Roboto'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10
  },
  logo: {
    width: 90
  },
  companyInfo: {
    fontSize: 10,
    color: '#000000',
    justifyContent: 'center'
  },
  mainContent: {
    flexDirection: 'row',
    marginBottom: 60
  },
  leftColumn: {
    width: '50%',
    paddingLeft: 100
  },
  rightColumn: {
    width: '50%',
    paddingLeft: 50
  },
  sectionTitle: {
    color: '#D35C37', // Couleur orange du modèle
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
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
  piloteInfoGroup: {
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
  devisInfoSeparator: {
    width: 20,
    textAlign: 'center',
  },
  table: {
    marginTop: 5
  },
  tableHeader: {
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
    color: '#000080',
    fontWeight: 'bold',
    fontSize: 10,
  },
  descriptionCol: {
    width: '55%',
    color: '#000080',
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
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 8,
    textAlign: 'center',
    color: '#666'
  },
  sectionName: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#973C39',
    marginBottom: 8,
  },
  materialRow: {
    marginLeft: 0,
    paddingLeft: 0,
    flexDirection: 'row',
    paddingVertical: 2,
    fontSize: 9,
  },
  materialName: {
    width: '55%',
    color: '#666666',
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  materialQuantity: {
    width: '12%',
    textAlign: 'right',
    color: '#666666',
    fontStyle: 'normal',
    fontWeight: 'normal',
    paddingRight: 5,
  },
  materialPrice: {
    width: '10%',
    textAlign: 'right',
    color: '#666666',
    fontStyle: 'normal',
    fontWeight: 'normal',
    paddingRight: 5,
  },
  materialTva: {
    width: '10%',
    textAlign: 'right',
    color: '#666666',
    fontStyle: 'normal',
    fontWeight: 'normal',
    paddingRight: 5,
  },
  materialTotal: {
    width: '13%',
    textAlign: 'right',
    color: '#666666',
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  prestationDescription: {
    paddingLeft: 10,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: '#666666',
  },
  materialsTitle: {
    marginLeft: 0,
    paddingLeft: 0,
    marginTop: 10,
    flexDirection: 'row',
    fontSize: 9,
    color: '#FF4500',
    fontWeight: 'bold',
  },
  materialsTitleContent: {
    marginLeft: 0,
    paddingLeft: 8,
    fontStyle: 'normal',
    fontWeight: 'normal',
    borderLeftWidth: 0.5,
    borderLeftColor: '#FF4500',
    borderLeftStyle: 'dashed',
  },
  materialContent: {
    marginLeft: 0,
    paddingLeft: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: '#FF4500',
    borderLeftStyle: 'dashed',
    flexDirection: 'row',
    flex: 1,
    fontSize: 7,
  },
  prestationContainer: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000080',
    borderLeftStyle: 'dashed',
    marginLeft: 0,
    paddingLeft: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: 700,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  clientSection: {
    width: '50%',
    paddingLeft: 100,
  },
  projectSection: {
    width: '50%',
    paddingLeft: 50
  },
  totalsContainer: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '30%',
    
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
    color: '#000080',
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
    color: '#D35C37',
  },
  totalTTCValue: {
    fontSize: 12,
    fontWeight: 'bold',
    
  },
  sectionTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 4,
  },
  sectionTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000080',
    marginRight: 10,
  },
  sectionTotalValue: {
    fontSize: 10,
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
  commentsAndSignatureContainer: {
    marginTop: 20,
    minHeight: 150,
  },
  commentsSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#000080',
    minHeight: 50,
  },
  signatureContainer: {
    marginTop: 50,
    minHeight: 80,
  },
  signatureBlock: {
    marginTop: 10,
    paddingTop: 0,
    minHeight: 80,
    alignSelf: 'flex-end',
    width: '50%',
    textAlign: 'left',
  },
  signatureText: {
    fontSize: 10,
    marginBottom: 10,
  },
  commentsText: {
    fontSize: 10,
    color: '#000080',
  },
});

// Ajouter une fonction de formatage des nombres
const formatNumber = (num: number) => {
  return num.toFixed(2);
};

// Simplifier la fonction de formatage de date
const formatExpirationDate = (date: string | undefined) => {
  if (!date) return '';
  
  try {
    // Si la date est déjà au format DD/MM/YYYY
    if (date.includes('/')) {
      return date;
    }
    
    // Si la date est au format YYYY-MM-DD
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    
    // Si c'est un objet Date ou un timestamp
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    }
    
    return date;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '';
  }
};

export const PAYMENT_METHODS = {
  CASH: 'Espèces',
  CHECK: 'Chèque',
  BANK_TRANSFER: 'Virement bancaire',
  CREDIT_CARD: 'Carte bancaire'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Fonction utilitaire pour formater les nombres en toute sécurité
const safeNumber = (value: number | undefined | null): number => {
  return typeof value === 'number' ? value : 0;
};

// Fonction pour formater les prix
const formatPrice = (value: number | undefined | null): string => {
  return safeNumber(value).toFixed(2);
};

// Modifier le composant SignatureBlock pour supprimer le saut de page
const SignatureBlock = ({ style }: { style?: any }) => (
  <View style={[styles.signatureBlock, style]}>
    <Text style={styles.signatureText}>Bon pour accord</Text>
    <Text style={styles.signatureText}>Date: ____________________</Text>
    <Text style={styles.signatureText}>Signature: ____________________</Text>
  </View>
);

export const DevisPDF: React.FC<DevisPDFProps> = ({ devisNumber, expirationDate, paymentMethod, pilot, phone, email, sections, totals, contact, company, showMaterials, devisComments, showDevisComments, showDescriptions }) => {
  // Supprimer les logs de débogage qui peuvent causer des problèmes
  const formattedDate = formatExpirationDate(expirationDate);
  
  // Vérifier que les sections existent et ne sont pas vides
  const hasSections = Array.isArray(sections) && sections.length > 0;
  
  // Fonction pour vérifier si une section a des prestations
  const hasPrestations = (section: any) => {
    return Array.isArray(section.prestations) && section.prestations.length > 0;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* En-tête avec logo */}
        <PDFHeader 
          address={company?.address || '5 Avenue Ingres'}
          postalCode={company?.postalCode || '75016'}
          city={company?.city || 'Paris France'}
          siret={company?.siret || '892 278 193 00016'}
          decennale="146979536"
          logoPath={company?.logo || '/images/logo.png'}
          slogan="Au service de l'habitat"
        />

        {/* Client et Projet */}
        <View style={styles.header}>
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text>{contact?.name || ''}</Text>
            <Text>{contact?.address || ''}</Text>
            <Text>{contact?.postalCode || ''} {contact?.city || ''}</Text>
            <Text>{contact?.country || ''}</Text>
            <Text>{contact?.phone || ''}</Text>
          </View>
          <View style={styles.projectSection}>
            <Text style={styles.sectionTitle}>Prescripteur</Text>
            <Text>{contact?.prescriber?.nom || ''}</Text>
            <Text>{contact?.prescriber?.rue || ''}</Text>
            <Text>{contact?.prescriber?.cp || ''} {contact?.prescriber?.ville || ''}</Text>
            <Text>{contact?.prescriber?.pays || ''}</Text>
          </View>
        </View>

        {/* Informations du devis */}
        <View style={styles.devisInfo}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>
            Devis N° : {devisNumber || ''}
          </Text>
          <View style={styles.devisInfoRow}>
            <View style={styles.devisInfoGroup}>
              <Text style={styles.devisInfoLabel}>Date:</Text>
              <Text style={styles.devisInfoValue}>{new Date().toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.devisInfoGroup}>
              <Text style={styles.devisInfoLabel}>Expiration:</Text>
              <Text style={styles.devisInfoValue}>{formattedDate || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.piloteInfoGroup}>
              <Text style={styles.devisInfoLabel}>Pilote:</Text>
              <Text style={styles.devisInfoValue}>{pilot || 'Noureddine MLAIEH'}</Text>
              <Text style={[styles.devisInfoLabel, {marginTop: 5}]}>{phone || '06 20 20 20 20'}</Text>
              <Text style={styles.devisInfoLabel}>{email || 'servicepose@bravotravo.com'}</Text>
            </View>
          </View>
        </View>

        {/* Tableau des prestations */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.enteteDevis, {color: 'black'}]}>Description</Text> 
            <Text style={styles.quantityCol}>Quantité</Text>
            <Text style={styles.priceCol}>P.U</Text>
            <Text style={styles.tvaCol}>TVA</Text>
            <Text style={styles.totalCol}>Montant</Text>
          </View>

          {hasSections ? (
            sections.map((section, sectionIndex) => (
              <View key={sectionIndex}>
                <Text style={styles.sectionName}>{section.name || ''}</Text>
                {hasPrestations(section) ? (
                  section.prestations.map((prestation, index) => (
                    <View key={index} style={styles.prestationContainer}>
                      <View style={styles.tableRow}>
                        <Text style={styles.descriptionCol}>
                          {prestation.name || ''}
                          {showDescriptions && prestation.description && (
                            <Text style={styles.prestationDescription}>
                              {"\n"}{prestation.description}
                            </Text>
                          )}
                        </Text>
                        <Text style={styles.quantityCol}>
                          {formatNumber(safeNumber(prestation.quantity))} {prestation.unit || ''}
                        </Text>
                        <Text style={styles.priceCol}>
                          {formatPrice(prestation.unitPrice)} €
                        </Text>
                        <Text style={styles.tvaCol}>
                          {safeNumber(prestation.tva)}%
                        </Text>
                        <Text style={styles.totalCol}>
                          {formatPrice(safeNumber(prestation.quantity) * safeNumber(prestation.unitPrice))} €
                        </Text>
                      </View>
                      
                      {prestation.materials && prestation.materials.length > 0 && showMaterials && (
                        <>
                          <View style={styles.materialsTitle}>
                            <View style={styles.materialsTitleContent}>
                              <Text>Matériaux :</Text>
                            </View>
                          </View>
                          {prestation.materials.map((material, materialIndex) => (
                            <View key={materialIndex} style={styles.materialRow}>
                              <View style={styles.materialContent}>
                                <Text style={styles.materialName}>
                                  {material.name || ''} {material.reference ? `(Réf. ${material.reference})` : '(à choisir)'}
                                </Text>
                                <Text style={styles.materialQuantity}>
                                  {formatNumber(safeNumber(material.quantity))} {material.unit || ''}
                                </Text>
                                <Text style={styles.materialPrice}>
                                  {formatPrice(material.price)} €
                                </Text>
                                <Text style={styles.materialTva}>
                                  {safeNumber(material.tva)}%
                                </Text>
                                <Text style={styles.materialTotal}>
                                  {formatPrice(safeNumber(material.quantity) * safeNumber(material.price))} €
                                </Text>
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.prestationContainer}>
                    <Text style={styles.descriptionCol}>Aucune prestation dans cette section</Text>
                  </View>
                )}
                
                {/* Totaux de section */}
                <View style={styles.sectionTotal}>
                  <Text style={styles.sectionTotalLabel}>
                    Total matériaux HT:
                  </Text>
                  <Text style={styles.sectionTotalValue}>{formatPrice(section.materialsTotal)} €</Text>
                </View>
                <View style={styles.sectionTotal}>
                  <Text style={styles.sectionTotalLabel}>
                    Total section HT:
                  </Text>
                  <Text style={styles.sectionTotalValue}>{formatPrice(section.subTotal)} €</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.prestationContainer}>
              <Text style={styles.descriptionCol}>Aucune section dans ce devis</Text>
            </View>
          )}
        </View>

        {/* Ajouter avant le pied de page */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatNumber(totals?.totalHT || 0)} €</Text>
          </View>
          {totals?.services?.tvaDetails && totals.services.tvaDetails.map(({ taux, tva }, index) => (
            <View key={`service-tva-${index}`} style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA {taux}%</Text>
              <Text style={styles.totalValue}>{formatNumber(tva)} €</Text>
            </View>
          ))}
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLabel}>Total TTC</Text>
            <Text style={styles.totalTTCValue}>{formatNumber(totals?.totalTTC || 0)} €</Text>
          </View>
          
          {/* Ajouter le mode de paiement */}
          {paymentMethod && (
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodText}>
                Mode de paiement : {paymentMethod}
              </Text>
            </View>
          )}
        </View>

        {/* Commentaires et signature avec gestion de l'espace */}
        <View style={styles.commentsAndSignatureContainer}>
          {showDevisComments && devisComments && (
            <PDFComments 
              comments={devisComments} 
              title="Commentaires" 
              showTitle={true}
              breakPage={false}
            />
          )}
          
          <View style={styles.signatureContainer}>
            <SignatureBlock />
          </View>
        </View>

        {/* Ajouter le pied de page */}
        <PDFFooter pageNumber={1} totalPages={1} website="www.bravotravo.com" />
      </Page>
    </Document>
  );
}; 
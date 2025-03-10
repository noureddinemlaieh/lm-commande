import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFComments } from './PDFComments';

// Modifier l'enregistrement des polices
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: '/fonts/Roboto-Regular.ttf',  // Police locale
      fontWeight: 'normal',
    },
    {
      src: '/fonts/Roboto-Bold.ttf',     // Police locale
      fontWeight: 'bold',
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
    prestations: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      tva: number;
      amount: number;
      description?: string;
      notes?: string;
      conditions?: string;
      billable?: boolean;
      materials: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        unit: string;
        reference?: string;
        tva: number;
        billable?: boolean;
      }>;
    }>;
    materialsTotal: number;
    subTotal: number;
  }>;
  totals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    services: {
      totalHT: number;
      tvaDetails: Array<{
        taux: number;
        ht: number;
        tva: number;
      }>;
    };
    materials: {
      totalHT: number;
      tvaDetails: Array<{
        taux: number;
        ht: number;
        tva: number;
      }>;
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
      nom: string;
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
  devisComments?: string;
  showDevisComments?: boolean;
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
    width: 80
  },
  companyInfo: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#000000',
    justifyContent: 'center'
  },
  mainContent: {
    flexDirection: 'row',
    marginBottom: 60
  },
  leftColumn: {
    width: '50%'
  },
  rightColumn: {
    width: '50%'
  },
  sectionTitle: {
    color: '#D35C37',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
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
  prestationContainer: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#000080',
    borderLeftStyle: 'dashed',
    marginLeft: 0,
    paddingLeft: 8,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  materialsContainer: {
    marginLeft: 0,
    marginTop: 2,
    marginBottom: 8,
  },
  materialsTitle: {
    marginLeft: 0,
    paddingLeft: 0,
    marginTop: 2,
    flexDirection: 'row',
    fontSize: 9,
    color: '#FF4500',
    fontWeight: 'bold',
  },
  materialsTitleContent: {
    marginLeft: 0,
    paddingLeft: 8,
    fontWeight: 'normal',
    borderLeftWidth: 0.5,
    borderLeftColor: '#FF4500',
    borderLeftStyle: 'dashed',
    paddingBottom: 5,
  },
  materialsList: {
    marginLeft: 0,
    paddingLeft: 8,
    borderLeftWidth: 0.5,
    borderLeftColor: '#FF4500',
    borderLeftStyle: 'dashed',
    marginTop: -2,
  },
  materialItem: {
    marginBottom: 3,
  },
  materialRow: {
    flexDirection: 'row',
    marginLeft: 0,
    marginBottom: 1,
    fontSize: 7,
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
  materialName: {
    flex: 6,
    paddingRight: 5,
  },
    materialReference: {
    flex: 1,
    textAlign: 'left',
    
  },
  materialQuantity: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 5,
  },
  materialPrice: {
    flex: 1.5,
    textAlign: 'right',
    paddingRight: 5,
  },
  materialTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingVertical: 5,
    marginBottom: 10,
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
    color: '#000080',
    fontSize: 10,
    paddingRight: 5,
    fontWeight: 'bold',
  },
  priceCol: {
    width: '12%',
    textAlign: 'right',
    color: '#000080',
    fontSize: 10,
    paddingRight: -5,
    fontWeight: 'bold',
  },
  tvaCol: {
    width: '8%',
    textAlign: 'right',
    color: '#000080',
    fontSize: 10,
    
    fontWeight: 'bold',
  },
  totalCol: {
    width: '13%',
    textAlign: 'right',
    color: '#000080',
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 5
  },
  materialTVA: {
    width: '10%',
    textAlign: 'right',
    color: '#666666',
    fontWeight: 'normal',
    paddingRight: 5,
  },
  totalsContainer: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '30%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    color: '#000080',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalValue: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  totalTTCLabel: {
    color: '#D35C37',
    fontWeight: 'bold',
    fontSize: 10,
  },
  totalTTCValue: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
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
  prestationDescription: {
    paddingLeft: 10,
    paddingTop: 2,
    paddingBottom: 2,
    fontSize: 9,
    color: '#666666',
  },
  signatureBlock: {
    marginTop: 40,
    paddingTop: 0,
    minHeight: 100,
    alignSelf: 'flex-end',
    width: '50%',
    textAlign: 'left',
  },
  signatureText: {
    fontSize: 10,
    marginBottom: 10,
  },

  materialUnit: {
    flex: 1,
    textAlign: 'center',
  },
  commentsSection: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
  },
  commentsText: {
    fontSize: 9,
    color: '#000',
  },
  piloteInfoGroup: {
    flexDirection: 'column',
  },
});

// Ajouter une fonction de formatage des nombres
const formatNumber = (num: number) => {
  return num.toFixed(2);
};

// Ajouter la fonction de formatage de date
const formatExpirationDate = (date: string | undefined) => {
  if (!date) return '';
  
  console.log('Date reçue dans formatExpirationDate:', date);
  
  // Gérer le format spécial "09T00:00:00.000Z/03/2025"
  if (date.includes('T00:00:00.000Z')) {
    const [day, month, year] = date.split(/T00:00:00\.000Z\/|\//)
    return `${day}/${month}/${year}`;
  }
  
  // Si la date est au format YYYY-MM-DD
  if (date.includes('-')) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Si la date est déjà au format DD/MM/YYYY
  if (date.includes('/')) {
    return date;
  }
  
  return date;
};

// Modifier le composant SignatureBlock pour supprimer le saut de page
const SignatureBlock = ({ style }: { style?: any }) => (
  <View style={[styles.signatureBlock, style]}>
    <Text style={styles.signatureText}>Bon pour accord</Text>
    <Text style={styles.signatureText}>Date: ____________________</Text>
    <Text style={styles.signatureText}>Signature: ____________________</Text>
  </View>
);

export const DevisWithMaterialsPDF: React.FC<DevisPDFProps> = ({ devisNumber, expirationDate, paymentMethod, pilot, phone, email, sections, totals, contact, company, devisComments, showDevisComments }) => {
  console.log('DevisWithMaterialsPDF - expirationDate reçue:', expirationDate);  // Log 5
  
  const formattedDate = formatExpirationDate(expirationDate);
  console.log('DevisWithMaterialsPDF - formattedDate:', formattedDate);  // Log 6

  // Ajouter ces logs au début du composant
  console.log('Props reçues dans DevisWithMaterialsPDF:', {
    devisNumber,
    expirationDate,
    paymentMethod,  // Vérifier spécifiquement cette valeur
    pilot,
    phone,
    email
  });

  console.log('DevisWithMaterialsPDF - devisNumber:', devisNumber);
  console.log('DevisWithMaterialsPDF - sections:', JSON.stringify(sections, null, 2));
  console.log('DevisWithMaterialsPDF - totals:', JSON.stringify(totals, null, 2));
  console.log('DevisWithMaterialsPDF - contact:', JSON.stringify(contact, null, 2));
  console.log('DevisWithMaterialsPDF - company:', JSON.stringify(company, null, 2));
  console.log('Mode de paiement reçu:', paymentMethod);

  // Ajouter ce log pour voir la valeur exacte reçue
  console.log('Mode de paiement reçu dans le PDF:', paymentMethod, typeof paymentMethod);

  if (!sections || sections.length === 0) {
    console.warn('No sections provided to DevisWithMaterialsPDF');
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Aucune donnée à afficher</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader 
          address={company.address || '5 Avenue Ingres'}
          postalCode={company.postalCode || '75016'}
          city={company.city || 'Paris France'}
          siret={company.siret || '892 278 193 00016'}
          decennale="146979536"
          logoPath={company.logo || '/images/logo.png'}
          slogan="Au service de l'habitat"
        />

        {/* Client et Projet */}
        <View style={styles.header}>
          <View style={styles.clientSection}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text>{contact?.name}</Text>
            <Text>{contact?.address}</Text>
            <Text>{contact?.postalCode} {contact?.city}</Text>
            <Text>{contact?.country}</Text>
            <Text>{contact?.phone}</Text>
          </View>
          <View style={styles.projectSection}>
            <Text style={styles.sectionTitle}>Prescripteur</Text>
            <Text>{contact?.prescriber?.nom}</Text>
            <Text>{contact?.prescriber?.rue}</Text>
            <Text>{contact?.prescriber?.cp} {contact?.prescriber?.ville}</Text>
            <Text>{contact?.prescriber?.pays}</Text>
          </View>
        </View>

        {/* Informations du devis */}
        <View style={styles.devisInfo}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>
            Devis N° : {devisNumber}
          </Text>
          <View style={styles.devisInfoRow}>
            <View style={styles.devisInfoGroup}>
              <Text style={styles.devisInfoLabel}>Date:</Text>
              <Text style={styles.devisInfoValue}>{new Date().toLocaleDateString('fr-FR')}</Text>
            </View>
            <View style={styles.devisInfoGroup}>
              <Text style={styles.devisInfoLabel}>Expiration:</Text>
              <Text style={styles.devisInfoValue}>{formattedDate}</Text>
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
            <Text style={[styles.descriptionCol, {color: 'black'}]}>Description</Text>
            <Text style={[styles.quantityCol, {color: 'black'}]}>Quantité</Text>
            <Text style={[styles.priceCol, {color: 'black'}]}>P.U</Text>
            <Text style={[styles.tvaCol, {color: 'black'}]}>TVA</Text>
            <Text style={[styles.totalCol, {color: 'black'}]}>Montant</Text>
          </View>

          {sections.map(section => (
            <View key={section.id}>
              <Text style={styles.sectionName}>{section.name}</Text>
              {section.prestations.map(prestation => (
                <View key={prestation.id} style={styles.prestationContainer}>
                  <View style={styles.tableRow}>
                    <Text style={styles.descriptionCol}>{prestation.name}</Text>
                    <Text style={[styles.quantityCol, {color: 'black'}]}>
                      {formatNumber(prestation.quantity)} {prestation.unit}
                    </Text>
                    <Text style={[styles.priceCol, {color: 'black'}]}>
                      {prestation.billable !== false ? formatNumber(prestation.unitPrice) : "0,00"} €
                    </Text>
                    <Text style={[styles.tvaCol, {color: 'black'}]}>{prestation.tva}%</Text>
                    <Text style={[styles.totalCol, {color: 'black'}]}>
                      {prestation.billable !== false ? formatNumber(prestation.quantity * prestation.unitPrice) : "0,00"} €
                    </Text>
                  </View>

                  {prestation.materials.length > 0 && (
                    <View style={styles.materialsContainer}>
                      <View style={styles.materialsTitle}>
                        <View style={styles.materialsTitleContent}>
                          <Text>Matériaux :</Text>
                        </View>
                      </View>
                      
                      <View style={styles.materialsList}>
                        {prestation.materials.map((material, materialIndex) => (
                          <View key={`material-${materialIndex}`} style={styles.materialRow}>
                            <Text style={styles.materialName}>{material.name}</Text>
                            <Text style={styles.materialReference}>{material.reference || ''}</Text>
                            <Text style={styles.materialQuantity}>{formatNumber(material.quantity)} {material.unit || ''}</Text>
                            <Text style={styles.materialPrice}>
                              {material.billable !== false ? formatNumber(material.price) : "0,00"} €
                            </Text>
                            <Text style={styles.materialTVA}>{material.tva || '20'}%</Text>
                            <Text style={styles.materialTotal}>
                              {material.billable !== false ? formatNumber(material.quantity * material.price) : "0,00"} €
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              ))}
              
              {/* Ajouter le sous-total de la section */}
              <View style={styles.sectionTotal}>
                <Text style={styles.sectionTotalLabel}>Sous-total</Text>
                <Text style={styles.sectionTotalValue}>
                  {formatNumber(
                    // Calculer le sous-total des prestations facturables
                    section.prestations.reduce((total, prestation) => 
                      prestation.billable !== false 
                        ? total + (prestation.quantity * prestation.unitPrice) 
                        : total, 0) +
                    // Ajouter le sous-total des matériaux facturables
                    section.prestations.reduce((total, prestation) => 
                      total + prestation.materials.reduce((materialTotal, material) => 
                        material.billable !== false 
                          ? materialTotal + (material.quantity * material.price) 
                          : materialTotal, 0), 0)
                  )} €
                </Text>
              </View>
            </View>
          ))}

          {/* Totaux */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatNumber(totals.totalHT)} €</Text>
            </View>
            
            {/* TVA Services */}
            {totals.services.tvaDetails.map(({ taux, tva }, index) => (
              <View key={`service-tva-${index}`} style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA Services {taux}%</Text>
                <Text style={styles.totalValue}>{formatNumber(tva)} €</Text>
              </View>
            ))}

            {/* TVA Matériaux */}
            {totals.materials.tvaDetails.map(({ taux, tva }, index) => (
              <View key={`material-tva-${index}`} style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA Matériaux {taux}%</Text>
                <Text style={styles.totalValue}>{formatNumber(tva)} €</Text>
              </View>
            ))}

            <View style={styles.totalTTCRow}>
              <Text style={styles.totalTTCLabel}>Total TTC</Text>
              <Text style={styles.totalTTCValue}>{formatNumber(totals.totalTTC)} €</Text>
            </View>
            
            {/* Modifier cette partie */}
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodText}>
                Mode de paiement : {paymentMethod ? paymentMethod : 'Non spécifié'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ marginTop: 20 }}>
          {showDevisComments && devisComments && (
            <PDFComments 
              comments={devisComments} 
              breakPage={false} 
              showTitle={true}
            />
          )}
          
          <View style={{ marginTop: 10 }}>
            <SignatureBlock style={{ marginTop: 0 }} />
          </View>
        </View>
        
        <PDFFooter website="www.bravotravo.com" pageNumber={1} totalPages={1} />
      </Page>
    </Document>
  );
}; 
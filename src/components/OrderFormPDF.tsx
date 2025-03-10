import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Roboto } from 'next/font/google';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFComments } from './PDFComments';
import { useState, useEffect } from 'react';

interface OrderFormPDFProps {
  orderNumber?: string;
  pilot?: string;
  phone?: string;
  email?: string;
  devisReference?: string;
  sections: Array<{
    id: string;
    name: string;
    prestations: Array<{
      id: string;
      name: string;
      materials: Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        price: number;
        reference?: string;
      }>;
    }>;
  }>;
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
  orderFormComments?: string;
  showOrderFormComments?: boolean;
}

// Initialiser Roboto avec next/font
const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

// Enregistrer les polices Roboto pour react-pdf
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: '10mm',
    fontSize: 10,
    fontFamily: 'Roboto'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    justifyContent: 'space-between'
  },
  clientSection: {
    width: '40%',
    paddingLeft: 90
  },
  projectSection: {
    width: '40%'
  },
  sectionTitle: {
    color: '#D35C37',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold'
  },
  pilote_Date: {
    
    paddingLeft: 5,
    fontSize: 10,
    marginTop: -20,
    textAlign: 'right',
  },
   piloteInfo: {    
    paddingLeft: 5,
    fontSize: 10,
  
  },
  title: {
    
    fontFamily: 'Roboto', 
    marginTop: 20,  
    color: '#D35C37', // Couleur orange du modèle
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    marginLeft: 30,
  },
  table: {
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'white', //couleur gris foncé pour la ligne des sections
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000'
  },
  tableHeaderText: {
    color: '#9CA9B8',
    fontSize: 8,
    paddingRight: 0
  },
  sectionHeader: {
    flexDirection: 'row',
    backgroundColor: '#ACB9CA',
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc'
  },
  prestationRow: {
    flexDirection: 'row',
    backgroundColor: '#D6DCE4', //couleur gris clair pour la ligne des prestations
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    marginBottom: 8
  },
  materialsContainer: {
    marginTop: 6,
    marginBottom:10
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    padding: 4,
  },
  designation: { 
    width: '75%',
    color: '#D35C37', //couleur orange texte designation section et prestation
    fontWeight: 'bold'
  },

  designationSection: {
    width: '75%',
    color: '#0B3A66' //couleur orange texte designation section et prestation
  },
  quantity: { 
    width: '8%',
    textAlign: 'right',
    color: '#0B3A66',
  },
  unit: { 
    width: '7%',
    textAlign: 'center',
    color: '#0B3A66'
  },
  reference: { 
    width: '10%',
    textAlign: 'right',
    color: '#0B3A66',
  },
  redText: {
    color: '#FF0000'
  },
  materialIcon: {
    marginRight: 5,
    fontSize: 8,
  },
  materialDesignation: { 
    width: '75%',
    flexDirection: 'row',
    alignItems: 'center'
  },
  materialText: {
    fontFamily: 'Roboto',
    color: '#0B3A66',
    marginLeft: 2
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 10
  },
  logo: {
    width: 80  // Plus large pour le logo BRAVO TRAVO
  },
  companyInfo: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: '#000000',
    justifyContent: 'center'
  },
  text: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 400,
  },
  bold: {
    fontFamily: 'Roboto',
    fontWeight: 700,
  },
  commentsSection: {
    marginTop: 50,
    padding: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'solid'
  },
  commentsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Roboto',
    color: '#D35C37',
  },
  commentsText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#000000',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 10,
    marginLeft: 30,
    marginRight: 30,
  },
  dateColumn: {
    width: '40%',
    alignItems: 'flex-end',
  },
  piloteColumn: {
    width: '40%',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D35C37',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 10,
    marginBottom: 3,
  },
  originReference: {
    fontFamily: 'Roboto',
    color: '#0B3A66', // Couleur bleue pour le distinguer du titre
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 30,
  },
});

// Créer un composant wrapper pour gérer la récupération du numéro de bon de commande
export const OrderFormPDF: React.FC<OrderFormPDFProps> = (props) => {
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Toujours récupérer un nouveau numéro depuis l'API, indépendamment de ce qui est passé en paramètre
    const fetchOrderNumber = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/bon-commande/sequence');
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();
        setGeneratedOrderNumber(data.reference);
      } catch (error) {
        console.error('Erreur lors de la récupération du numéro de bon de commande:', error);
        setGeneratedOrderNumber('ERROR-' + Date.now());
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderNumber();
  }, []); // Ne dépend plus de props.orderNumber
  
  // Afficher un message de chargement si nécessaire
  if (loading) {
    return (
      <Document>
        <Page size="A4">
          <View style={{ padding: 30 }}>
            <Text>Génération du numéro de bon de commande...</Text>
          </View>
        </Page>
      </Document>
    );
  }
  
  // Rendre le PDF avec le numéro de commande généré
  return <OrderFormPDFContent 
    {...props} 
    orderNumber={generatedOrderNumber || 'ERROR'} 
  />;
};

// Composant interne qui gère le rendu du PDF
const OrderFormPDFContent: React.FC<OrderFormPDFProps & { orderNumber: string }> = ({ 
  orderNumber, 
  sections, 
  contact, 
  company, 
  orderFormComments, 
  showOrderFormComments, 
  pilot, 
  phone, 
  email,
  devisReference
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* En-tête avec logo et infos entreprise */}
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

      {/* Titre du bon de commande - déplacé ici */}
      <Text style={styles.title}>BON DE COMMANDE N° {orderNumber}</Text>
      
      {/* Afficher l'origine (numéro de devis) si disponible */}
      {devisReference && (
        <Text style={styles.originReference}>Origine : {devisReference}</Text>
      )}

      {/* Section pilote et date - maintenant après le titre */}
      <View style={styles.infoSection}>
        <View style={styles.piloteColumn}>
          <Text style={styles.infoLabel}>Pilote:</Text>
          <Text style={styles.infoValue}>{pilot || 'Noureddine MLAIEH'}</Text>
          <Text style={styles.infoValue}>{phone || '06 20 20 20 20'}</Text>
          <Text style={styles.infoValue}>{email || 'servicepose@bravotravo.com'}</Text>
        </View>
        <View style={styles.dateColumn}>
          <Text style={[styles.infoLabel, {marginRight: 60}]}>Date:</Text>
          <Text style={[styles.infoValue, {marginRight: 30}]}>{new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>

      {/* Tableau */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.designation, styles.tableHeaderText]}>Désignation</Text>
          <Text style={[styles.quantity, styles.tableHeaderText]}>Quantité</Text>
          <Text style={[styles.unit, styles.tableHeaderText]}>U</Text>
          <Text style={[styles.reference, styles.tableHeaderText]}>Réf-LM</Text>
        </View>

        {sections.map(section => (
          <View key={section.id}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.designationSection, { fontWeight: 'bold' }]}>{section.name}</Text>
              <Text style={styles.quantity}></Text>
              <Text style={styles.unit}></Text>
              <Text style={styles.reference}></Text>
            </View>
            {section.prestations.map(prestation => (
              <View key={prestation.id}>
                <View style={styles.prestationRow}>
                  <Text style={styles.designation}>{prestation.name}</Text>
                  <Text style={styles.quantity}></Text>
                  <Text style={styles.unit}></Text>
                  <Text style={styles.reference}></Text>
                </View>
                {prestation.materials.length > 0 && (
                  <View style={styles.materialsContainer}>
                    {prestation.materials.map(material => (
                      <View key={material.id} style={styles.tableRow}>
                        <View style={styles.materialDesignation}>
                          <Text style={styles.materialIcon}>•</Text>
                          <Text style={styles.materialText}>{material.name}</Text>
                        </View>
                        {material.name.toLowerCase() !== 'rien' && (
                          <>
                            <Text style={styles.quantity}>{material.quantity}</Text>
                            <Text style={styles.unit}>{material.unit}</Text>
                            <Text style={[styles.reference, material.reference ? {} : styles.redText]}>
                              {material.reference || 'à choisir'}
                            </Text>
                          </>
                        )}
                        {material.name.toLowerCase() === 'rien' && (
                          <>
                            <Text style={styles.quantity}></Text>
                            <Text style={styles.unit}></Text>
                            <Text style={styles.reference}></Text>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Afficher les commentaires du bon de commande si nécessaire */}
      {showOrderFormComments && orderFormComments && (
        <PDFComments 
          comments={orderFormComments} 
          fixedPosition={false} 
          breakPage={false} 
        />
      )}

      {/* Ajouter le pied de page */}
      <PDFFooter pageNumber={1} totalPages={1} website="www.bravotravo.com" />
    </Page>
  </Document>
); 
import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// Définir l'interface pour les propriétés
interface PDFHeaderProps {
  companyName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  siret?: string;
  decennale?: string;
  logoPath?: string;
  slogan?: string;
}

// Styles pour l'en-tête
const styles = StyleSheet.create({
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
  serviceTitle: {
    position: 'absolute',
    right: 0,
    top: 8
  },
  serviceTitleText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
});

// Composant d'en-tête réutilisable
export const PDFHeader: React.FC<PDFHeaderProps> = ({
  companyName = '',
  address = '5 Avenue Ingres',
  postalCode = '75016',
  city = 'Paris France',
  siret = '892 278 193 00016',
  decennale = '146979536',
  logoPath = '/images/logo.png',
  slogan = 'Au service de l\'habitat'
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoAndInfoContainer}>
        <Image 
          src={logoPath}
          style={styles.logo}
          alt="Logo de l'entreprise"
        />
        <View style={styles.divider}></View>
        <View style={styles.companyInfo}>
          <Text>{address}</Text>
          <Text>{postalCode} {city}</Text>
          <Text>N°Siret:{siret}</Text>
          <Text>DECENNALE MMA N°{decennale}</Text>
        </View>
      </View>
      <View style={styles.serviceTitle}>
        <Text style={styles.serviceTitleText}>{slogan}</Text>
      </View>
    </View>
  );
}; 
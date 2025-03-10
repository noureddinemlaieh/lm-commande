import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

export interface PDFFooterProps {
  pageNumber: number;
  totalPages: number;
  website: string;
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#666'
  },
  website: {
    color: '#0066cc',
  },
  pageNumbers: {
    textAlign: 'right'
  }
});

export const PDFFooter: React.FC<PDFFooterProps> = ({ pageNumber, totalPages, website }) => {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.website}>{website}</Text>
      <Text style={styles.pageNumbers} render={({ pageNumber, totalPages }) => (
        `Page: ${pageNumber} / ${totalPages}`
      )} />
    </View>
  );
}; 
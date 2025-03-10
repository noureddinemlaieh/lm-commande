import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

interface PDFCommentsProps {
  comments: string;
  title?: string;
  showTitle?: boolean;
  breakPage?: boolean;
  fixedPosition?: boolean;
}

const styles = StyleSheet.create({
  commentsSection: {
    marginTop: 70, // 70px d'espace après la dernière ligne de la commande
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
    color: '#FF4500',
  },
  commentsText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: '#000000',
  },
});

export const PDFComments: React.FC<PDFCommentsProps> = ({ 
  comments, 
  title = "Commentaires",
  showTitle = true,
  breakPage = false, // Par défaut, ne pas forcer une nouvelle page
  fixedPosition = false
}) => {
  return (
    <View style={styles.commentsSection} wrap>
      {showTitle && <Text style={styles.commentsTitle}>{title}</Text>}
      <Text style={styles.commentsText}>{comments}</Text>
    </View>
  );
}; 
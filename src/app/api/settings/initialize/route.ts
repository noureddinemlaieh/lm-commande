import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Initialiser les paramètres de base
    const defaultSettings = [
      // Paramètres de l'entreprise
      { key: 'company_name', value: 'Votre Entreprise', category: 'COMPANY', description: 'Nom de l\'entreprise' },
      { key: 'company_address', value: '123 Rue du Commerce', category: 'COMPANY', description: 'Adresse de l\'entreprise' },
      { key: 'company_city', value: 'Paris', category: 'COMPANY', description: 'Ville de l\'entreprise' },
      { key: 'company_zip', value: '75001', category: 'COMPANY', description: 'Code postal de l\'entreprise' },
      { key: 'company_country', value: 'France', category: 'COMPANY', description: 'Pays de l\'entreprise' },
      { key: 'company_phone', value: '01 23 45 67 89', category: 'COMPANY', description: 'Téléphone de l\'entreprise' },
      { key: 'company_email', value: 'contact@votreentreprise.com', category: 'COMPANY', description: 'Email de l\'entreprise' },
      { key: 'company_website', value: 'www.votreentreprise.com', category: 'COMPANY', description: 'Site web de l\'entreprise' },
      { key: 'company_siret', value: '123 456 789 00001', category: 'COMPANY', description: 'SIRET de l\'entreprise' },
      { key: 'company_tva', value: 'FR12345678900', category: 'COMPANY', description: 'Numéro de TVA de l\'entreprise' },
      
      // Paramètres de numérotation des devis
      { key: 'devis_prefix', value: 'DEVIS', category: 'NUMEROTATION', description: 'Préfixe des numéros de devis' },
      { key: 'devis_digits', value: '4', category: 'NUMEROTATION', description: 'Nombre de chiffres pour les numéros de devis' },
      { key: 'devis_counter', value: '1', category: 'NUMEROTATION', description: 'Compteur actuel pour les numéros de devis' },
      { key: 'devis_format', value: '{PREFIX}-{COUNTER}', category: 'NUMEROTATION', description: 'Format des numéros de devis' },
      { key: 'devis_reset_period', value: 'YEAR', category: 'NUMEROTATION', description: 'Période de réinitialisation du compteur (NEVER, YEAR, MONTH)' },
      
      // Paramètres de numérotation des factures
      { key: 'facture_prefix', value: 'FAC', category: 'NUMEROTATION', description: 'Préfixe des numéros de facture' },
      { key: 'facture_digits', value: '3', category: 'NUMEROTATION', description: 'Nombre de chiffres pour les numéros de facture' },
      { key: 'facture_counter', value: '1', category: 'NUMEROTATION', description: 'Compteur actuel pour les numéros de facture' },
      { key: 'facture_format', value: '{PREFIX}-{COUNTER}', category: 'NUMEROTATION', description: 'Format des numéros de facture' },
      { key: 'facture_reset_period', value: 'NEVER', category: 'NUMEROTATION', description: 'Période de réinitialisation du compteur (NEVER, YEAR, MONTH)' },
      
      // Paramètres de numérotation des bons de commande
      { key: 'bon_commande_prefix', value: 'BC', category: 'NUMEROTATION', description: 'Préfixe des numéros de bon de commande' },
      { key: 'bon_commande_digits', value: '4', category: 'NUMEROTATION', description: 'Nombre de chiffres pour les numéros de bon de commande' },
      { key: 'bon_commande_counter', value: '1', category: 'NUMEROTATION', description: 'Compteur actuel pour les numéros de bon de commande' },
      { key: 'bon_commande_format', value: '{PREFIX}-{COUNTER}', category: 'NUMEROTATION', description: 'Format des numéros de bon de commande' },
      { key: 'bon_commande_reset_period', value: 'YEAR', category: 'NUMEROTATION', description: 'Période de réinitialisation du compteur (NEVER, YEAR, MONTH)' },
      
      // Paramètres de paiement
      { key: 'payment_delay', value: '30', category: 'PAYMENT', description: 'Délai de paiement en jours' },
      { key: 'payment_methods', value: 'Virement bancaire,Chèque,Espèces,Carte bancaire', category: 'PAYMENT', description: 'Méthodes de paiement disponibles' },
      { key: 'default_payment_method', value: 'Virement bancaire', category: 'PAYMENT', description: 'Méthode de paiement par défaut' },
      
      // Paramètres bancaires
      { key: 'bank_name', value: 'Banque Exemple', category: 'BANK', description: 'Nom de la banque' },
      { key: 'bank_iban', value: 'FR76 1234 5678 9012 3456 7890 123', category: 'BANK', description: 'IBAN' },
      { key: 'bank_bic', value: 'EXAMPLEBIC', category: 'BANK', description: 'BIC/SWIFT' },
      
      // Paramètres de TVA
      { key: 'default_tva', value: '20', category: 'TVA', description: 'Taux de TVA par défaut' },
      { key: 'available_tva', value: '0,5.5,10,20', category: 'TVA', description: 'Taux de TVA disponibles' },
    ];
    
    // Créer ou mettre à jour chaque paramètre
    for (const setting of defaultSettings) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { 
          value: setting.value,
          description: setting.description,
          category: setting.category
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category
        }
      });
    }
    
    return NextResponse.json({ success: true, message: 'Paramètres initialisés avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des paramètres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation des paramètres', details: String(error) },
      { status: 500 }
    );
  }
} 
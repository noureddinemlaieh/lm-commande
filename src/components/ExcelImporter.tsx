import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Button, message } from 'antd';
import { RawExcelProductData, ValidatedProductData } from '../types/ImportTypes';
import MaterialImportVerification, { MaterialConflict } from './MaterialImportVerification';

const ExcelImporter: React.FC<{ 
  onImport: (products: ValidatedProductData[]) => void,
  visible: boolean,
  onClose: () => void
}> = ({ onImport, visible, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [validatedProducts, setValidatedProducts] = useState<ValidatedProductData[]>([]);
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDownloadExample = () => {
    const exampleData = [
      {
        name: "Baguette de finition de l'épaisseur du revêtement",
        description: "baguette- à choisir (prix indicatif)",
        category: "material",
        cost: "2,78",
        unit: "ml",
        reference: "12345",
        sellingPrice: "2,78"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
    XLSX.writeFile(workbook, 'modele_import_produits.xlsx');
  };

  const validateAndConvertProduct = (product: RawExcelProductData): ValidatedProductData => {
    // Vérification et conversion du nom
    if (!product.name || typeof product.name !== 'string' && typeof product.name !== 'number') {
      throw new Error('Le nom est obligatoire et doit être une chaîne de caractères');
    }
    const name = String(product.name).trim();
    if (name.length === 0) {
      throw new Error('Le nom ne peut pas être vide');
    }
    
    // Vérification et conversion de la description
    const description = product.description 
      ? String(product.description).trim() 
      : null;
    
    // Vérification et conversion de la catégorie
    if (!product.category) {
      throw new Error('La catégorie est obligatoire');
    }
    const categoryStr = String(product.category).toUpperCase();
    if (categoryStr !== 'SERVICE' && categoryStr !== 'MATERIAL') {
      throw new Error(`Catégorie invalide pour le produit "${name}": ${product.category}`);
    }
    const category = categoryStr as 'SERVICE' | 'MATERIAL';
    
    // Vérification et conversion du coût
    if (product.cost === undefined || product.cost === null) {
      throw new Error(`Le coût est obligatoire pour le produit "${name}"`);
    }
    const costStr = typeof product.cost === 'string' 
      ? product.cost.replace(',', '.') 
      : String(product.cost);
    const cost = parseFloat(costStr);
    if (isNaN(cost)) {
      throw new Error(`Coût invalide pour le produit "${name}": ${product.cost}`);
    }
    
    // Vérification et conversion de l'unité
    const unit = product.unit ? String(product.unit).trim() : null;
    
    // Vérification et conversion de la référence
    const reference = product.reference ? String(product.reference).trim() : null;
    
    // Vérification et conversion du prix de vente
    if (product.sellingPrice === undefined || product.sellingPrice === null) {
      throw new Error(`Le prix de vente est obligatoire pour le produit "${name}"`);
    }
    const sellingPriceStr = typeof product.sellingPrice === 'string' 
      ? product.sellingPrice.replace(',', '.') 
      : String(product.sellingPrice);
    const sellingPrice = parseFloat(sellingPriceStr);
    if (isNaN(sellingPrice)) {
      throw new Error(`Prix de vente invalide pour le produit "${name}": ${product.sellingPrice}`);
    }
    
    return {
      name,
      description,
      category,
      cost,
      unit,
      reference,
      sellingPrice
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('Erreur de lecture du fichier');
        }
        
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Le fichier Excel ne contient aucune feuille');
        }
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet) as RawExcelProductData[];
        
        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('Aucune donnée trouvée dans le fichier Excel');
        }
        
        // Validation des champs requis
        const requiredFields = ['name', 'category', 'cost', 'sellingPrice'];
        const missingFields = rawData.some(item => 
          requiredFields.some(field => item[field as keyof RawExcelProductData] === undefined)
        );
        
        if (missingFields) {
          throw new Error('Format de fichier invalide. Les colonnes requises sont : name, category, cost, sellingPrice');
        }

        // Conversion et validation des données
        const validatedProducts: ValidatedProductData[] = [];
        const errors: string[] = [];
        
        for (let i = 0; i < rawData.length; i++) {
          try {
            const validatedProduct = validateAndConvertProduct(rawData[i]);
            validatedProducts.push(validatedProduct);
          } catch (err) {
            const errorMessage = err instanceof Error 
              ? err.message 
              : `Erreur à la ligne ${i + 2}`;
            errors.push(`Ligne ${i + 2}: ${errorMessage}`);
          }
        }
        
        if (errors.length > 0) {
          // Afficher les erreurs mais continuer avec les produits valides
          console.error('Erreurs de validation:', errors);
          message.warning(`${errors.length} erreurs trouvées. Voir la console pour plus de détails.`);
        }
        
        if (validatedProducts.length === 0) {
          throw new Error('Aucun produit valide trouvé dans le fichier');
        }

        // Filtrer pour ne garder que les matériaux
        const materialProducts = validatedProducts.filter(p => p.category === 'MATERIAL');
        
        if (materialProducts.length > 0) {
          // Stocker les produits validés et ouvrir la modale de vérification
          setValidatedProducts(validatedProducts);
          setIsVerificationModalVisible(true);
        } else {
          // S'il n'y a pas de matériaux, procéder directement à l'importation
          onImport(validatedProducts);
          message.success(`Importation réussie: ${validatedProducts.length} produits importés`);
          onClose();
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier Excel');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleVerificationConfirm = async (resolutions: MaterialConflict[]) => {
    try {
      // Envoyer les résolutions au serveur
      const response = await fetch('/api/products/conflict-resolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolutions }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la résolution des conflits');
      }

      const result = await response.json();
      
      // Filtrer les produits validés en fonction des résolutions
      const productsToImport = validatedProducts.filter(product => {
        // Si ce n'est pas un matériau, l'importer directement
        if (product.category !== 'MATERIAL') {
          return true;
        }
        
        // Vérifier si ce matériau est dans les résolutions
        const conflictResolution = resolutions.find(
          r => r.importMaterial.name === product.name || 
               (r.importMaterial.reference && r.importMaterial.reference === product.reference)
        );
        
        // Si pas de conflit ou résolution 'import', l'inclure
        return !conflictResolution || conflictResolution.resolution === 'import';
      });
      
      // Fermer la modale de vérification
      setIsVerificationModalVisible(false);
      
      // Importer les produits restants
      if (productsToImport.length > 0) {
        onImport(productsToImport);
      }
      
      // Afficher un message de succès
      message.success(
        `Importation terminée. ${result.results.updated} mis à jour, ` +
        `${result.results.created} créés, ${result.results.skipped} ignorés.`
      );
      
      // Fermer la modale principale
      onClose();
    } catch (error) {
      console.error('Erreur lors de la confirmation des résolutions:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la résolution des conflits');
    }
  };

  const handleVerificationCancel = () => {
    setIsVerificationModalVisible(false);
    setValidatedProducts([]);
  };

  return (
    <>
      <Modal
        title="Importer des produits"
        open={visible}
        onCancel={onClose}
        footer={null}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              onClick={handleDownloadExample}
            >
              Télécharger un exemple
            </Button>
          </div>

          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            style={{ marginBottom: 16 }}
            disabled={isLoading}
          />

          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
          {isLoading && <div style={{ marginTop: 10 }}>Chargement en cours...</div>}
          
          <div style={{ marginTop: 10 }}>
            <p>Format attendu :</p>
            <ul>
              <li>name (string) - <strong>Obligatoire</strong></li>
              <li>description (string) - Optionnel</li>
              <li>category (string: &quot;SERVICE&quot; ou &quot;MATERIAL&quot;) - <strong>Obligatoire</strong></li>
              <li>cost (number) - <strong>Obligatoire</strong></li>
              <li>unit (string) - Optionnel</li>
              <li>reference (string) - Optionnel</li>
              <li>sellingPrice (number) - <strong>Obligatoire</strong></li>
            </ul>
          </div>
        </div>
      </Modal>

      <MaterialImportVerification
        visible={isVerificationModalVisible}
        onCancel={handleVerificationCancel}
        onConfirm={handleVerificationConfirm}
        materialsToImport={validatedProducts.filter(p => p.category === 'MATERIAL')}
        loading={isLoading}
      />
    </>
  );
};

export default ExcelImporter; 
import React, { useState } from 'react';
import { Modal, Upload, Button, message, Typography, Spin, Alert, Tabs } from 'antd';
import { UploadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';
import { ValidatedProductData } from '@/types/ImportTypes';
import CatalogItemVerification, { ServiceConflict, CatalogItemsToImport } from './CatalogItemVerification';
import { MaterialConflict } from './MaterialImportVerification';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface CatalogImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (catalogId: string) => void;
}

const CatalogImporter: React.FC<CatalogImporterProps> = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogName, setCatalogName] = useState<string>('');
  const [catalogDescription, setCatalogDescription] = useState<string>('');
  const [itemsToImport, setItemsToImport] = useState<CatalogItemsToImport>({ materials: [], services: [] });
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('excel');

  // Gérer le changement de fichier
  const handleFileChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList.slice(-1)); // Garder seulement le dernier fichier
    setError(null);
  };

  // Télécharger un exemple de fichier Excel
  const handleDownloadExcelExample = () => {
    // Créer un exemple de données
    const exampleData = [
      {
        name: 'Nom du produit',
        description: 'Description du produit',
        category: 'MATERIAL', // ou 'SERVICE'
        cost: 100,
        unit: 'u',
        reference: 'REF123',
        sellingPrice: 150
      },
      {
        name: 'Prestation exemple',
        description: 'Description de la prestation',
        category: 'SERVICE',
        cost: 80,
        unit: 'h',
        reference: 'SERV001',
        sellingPrice: 120
      }
    ];

    // Créer un classeur Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exampleData);
    
    // Ajouter une feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    
    // Générer le fichier et le télécharger
    XLSX.writeFile(wb, 'exemple_import_catalogue.xlsx');
  };

  // Télécharger un exemple de fichier JSON
  const handleDownloadJsonExample = () => {
    // Créer un exemple pour le nouveau format
    const newFormatExample = {
      name: "Nom du catalogue (Nouveau format)",
      description: "Description du catalogue",
      materials: [
        {
          name: "Matériau exemple",
          description: "Description du matériau",
          category: "MATERIAL",
          cost: 100,
          unit: "u",
          reference: "REF123",
          sellingPrice: 150
        }
      ],
      services: [
        {
          name: "Prestation exemple",
          description: "Description de la prestation",
          category: "SERVICE",
          cost: 80,
          unit: "h",
          reference: "SERV001",
          sellingPrice: 120
        }
      ]
    };

    // Créer un exemple pour l'ancien format
    const oldFormatExample = {
      name: "Nom du catalogue (Ancien format)",
      description: "Description du catalogue",
      categories: [
        {
          name: "Catégorie exemple",
          order: 1,
          services: [
            {
              name: "Prestation exemple",
              description: "Description de la prestation",
              price: 120,
              quantity: 1,
              unit: "h",
              order: 1,
              materials: [
                {
                  name: "Matériau exemple",
                  quantity: 1,
                  price: 150,
                  unit: "u",
                  reference: "REF123",
                  toChoose: false
                }
              ]
            }
          ]
        }
      ]
    };

    // Demander à l'utilisateur quel format il souhaite télécharger
    Modal.confirm({
      title: 'Choisir le format d&apos;exemple à télécharger :',
      content: (
        <div>
          <p>Veuillez choisir le format d&apos;exemple à télécharger :</p>
          <ul>
            <li><strong>Nouveau format</strong> : Format plat avec listes de matériaux et prestations</li>
            <li><strong>Ancien format</strong> : Format hiérarchique avec catégories, services et matériaux</li>
          </ul>
        </div>
      ),
      okText: 'Nouveau format',
      cancelText: 'Ancien format',
      onOk() {
        // Télécharger l'exemple au nouveau format
        const blob = new Blob([JSON.stringify(newFormatExample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exemple_import_catalogue_nouveau_format.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      onCancel() {
        // Télécharger l'exemple à l'ancien format
        const blob = new Blob([JSON.stringify(oldFormatExample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exemple_import_catalogue_ancien_format.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  // Valider et convertir les données d'un produit
  const validateAndConvertProduct = (product: any): ValidatedProductData | null => {
    try {
      // Vérifier les champs obligatoires
      if (!product.name || typeof product.name !== 'string') {
        throw new Error(`Le nom du produit est requis et doit être une chaîne de caractères`);
      }

      if (!product.category || (product.category !== 'MATERIAL' && product.category !== 'SERVICE')) {
        throw new Error(`La catégorie du produit doit être 'MATERIAL' ou 'SERVICE'`);
      }

      // Convertir et valider le coût
      let cost = 0;
      if (product.cost !== undefined) {
        if (typeof product.cost === 'number') {
          cost = product.cost;
        } else if (typeof product.cost === 'string') {
          const parsedCost = parseFloat(product.cost.replace(',', '.'));
          if (isNaN(parsedCost)) {
            throw new Error(`Coût invalide pour le produit "${product.name}": ${product.cost}`);
          }
          cost = parsedCost;
        } else {
          throw new Error(`Coût invalide pour le produit "${product.name}": ${product.cost}`);
        }
      }

      // Convertir et valider le prix de vente
      let sellingPrice = 0;
      if (product.sellingPrice !== undefined) {
        if (typeof product.sellingPrice === 'number') {
          sellingPrice = product.sellingPrice;
        } else if (typeof product.sellingPrice === 'string') {
          const parsedPrice = parseFloat(product.sellingPrice.replace(',', '.'));
          if (isNaN(parsedPrice)) {
            throw new Error(`Prix de vente invalide pour le produit "${product.name}": ${product.sellingPrice}`);
          }
          sellingPrice = parsedPrice;
        } else {
          throw new Error(`Prix de vente invalide pour le produit "${product.name}": ${product.sellingPrice}`);
        }
      }

      // Valider la description
      let description: string | null = null;
      if (product.description !== undefined && product.description !== null) {
        if (typeof product.description !== 'string') {
          throw new Error(`La description du produit "${product.name}" doit être une chaîne de caractères`);
        }
        description = product.description;
      }

      // Valider l'unité
      let unit: string | null = null;
      if (product.unit !== undefined && product.unit !== null) {
        if (typeof product.unit !== 'string') {
          throw new Error(`L'unité du produit "${product.name}" doit être une chaîne de caractères`);
        }
        unit = product.unit;
      }

      // Valider la référence
      let reference: string | null = null;
      if (product.reference !== undefined && product.reference !== null) {
        if (typeof product.reference !== 'string' && typeof product.reference !== 'number') {
          throw new Error(`La référence du produit "${product.name}" doit être une chaîne de caractères ou un nombre`);
        }
        reference = String(product.reference);
      }

      return {
        name: product.name,
        description,
        category: product.category,
        cost,
        unit,
        reference,
        sellingPrice
      };
    } catch (error) {
      console.error('Erreur de validation:', error);
      return null;
    }
  };

  // Traiter le fichier Excel
  const processExcelFile = async (file: File): Promise<CatalogItemsToImport> => {
    try {
      // Lire le fichier Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Vérifier si le classeur contient au moins une feuille
      if (workbook.SheetNames.length === 0) {
        throw new Error('Le fichier Excel ne contient aucune feuille');
      }

      // Utiliser la première feuille
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir la feuille en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Données Excel brutes:', jsonData);

      // Extraire le nom du catalogue à partir du nom du fichier
      const fileName = file.name.split('.')[0];
      setCatalogName(fileName || 'Catalogue importé');

      // Initialiser les tableaux pour les matériaux et les prestations
      const materials: ValidatedProductData[] = [];
      const services: ValidatedProductData[] = [];

      // Parcourir les lignes du fichier Excel
      for (const row of jsonData as Record<string, any>[]) {
        // Vérifier si la ligne contient les données nécessaires
        if (!row['name'] && !row['Name'] && !row['NOM']) {
          console.warn('Ligne sans nom ignorée:', row);
          continue;
        }

        // Normaliser les données
        const normalizedRow = {
          name: row['name'] || row['Name'] || row['NOM'] || '',
          description: row['description'] || row['Description'] || row['DESCRIPTION'] || null,
          category: (row['category'] || row['Category'] || row['CATEGORY'] || 'MATERIAL').toUpperCase(),
          cost: parseFloat(row['cost'] || row['Cost'] || row['COST'] || 0),
          unit: row['unit'] || row['Unit'] || row['UNIT'] || null,
          reference: row['reference'] || row['Reference'] || row['REFERENCE'] || null,
          sellingPrice: parseFloat(row['sellingPrice'] || row['SellingPrice'] || row['SELLING_PRICE'] || row['PRIX'] || 0)
        };

        // Valider et convertir les données
        const validatedProduct = validateAndConvertProduct(normalizedRow);
        
        if (validatedProduct) {
          // Ajouter au tableau approprié
          if (validatedProduct.category === 'MATERIAL') {
            materials.push(validatedProduct);
          } else if (validatedProduct.category === 'SERVICE') {
            services.push(validatedProduct);
          }
        }
      }

      console.log('Données Excel traitées:', {
        materials: materials.length,
        services: services.length,
        materialsData: materials,
        servicesData: services
      });

      return { materials, services };
    } catch (error) {
      console.error('Erreur lors du traitement du fichier Excel:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier Excel');
      return { materials: [], services: [] };
    }
  };

  // Traiter le fichier JSON
  const processJsonFile = async (file: File): Promise<CatalogItemsToImport> => {
    try {
      // Lire le fichier JSON
      const text = await file.text();
      const jsonData = JSON.parse(text);

      console.log('Données JSON brutes:', jsonData);

      // Extraire le nom et la description du catalogue
      setCatalogName(jsonData.name || '');
      setCatalogDescription(jsonData.description || '');

      // Initialiser les tableaux pour les matériaux et les prestations
      const materials: ValidatedProductData[] = [];
      const services: ValidatedProductData[] = [];

      // Vérifier le format du fichier JSON
      if (jsonData.materials && Array.isArray(jsonData.materials)) {
        // Nouveau format avec listes plates de matériaux et prestations
        console.log('Format JSON détecté: nouveau format (listes plates)');
        
        // Traiter les matériaux
        for (const material of jsonData.materials) {
          const validatedMaterial = validateAndConvertProduct({
            ...material,
            category: 'MATERIAL'
          });
          if (validatedMaterial) {
            materials.push(validatedMaterial);
          }
        }

        // Traiter les prestations
        if (jsonData.services && Array.isArray(jsonData.services)) {
          for (const service of jsonData.services) {
            const validatedService = validateAndConvertProduct({
              ...service,
              category: 'SERVICE'
            });
            if (validatedService) {
              services.push(validatedService);
            }
          }
        }
      } else if (jsonData.categories && Array.isArray(jsonData.categories)) {
        // Ancien format hiérarchique avec catégories, services et matériaux
        console.log('Format JSON détecté: ancien format (hiérarchique)');
        
        // Parcourir les catégories
        for (const category of jsonData.categories) {
          if (category.services && Array.isArray(category.services)) {
            // Parcourir les services de chaque catégorie
            for (const service of category.services) {
              // Ajouter le service comme une prestation
              const validatedService = validateAndConvertProduct({
                name: service.name,
                description: service.description,
                category: 'SERVICE',
                cost: service.price * 0.7, // Estimation du coût à 70% du prix
                unit: service.unit,
                sellingPrice: service.price
              });
              
              if (validatedService) {
                services.push(validatedService);
              }

              // Traiter les matériaux du service
              if (service.materials && Array.isArray(service.materials)) {
                for (const material of service.materials) {
                  // Ajouter le matériau
                  const validatedMaterial = validateAndConvertProduct({
                    name: material.name,
                    description: material.description || `Matériau pour ${service.name}`,
                    category: 'MATERIAL',
                    cost: material.price * 0.7, // Estimation du coût à 70% du prix
                    unit: material.unit,
                    reference: material.reference,
                    sellingPrice: material.price
                  });
                  
                  if (validatedMaterial) {
                    materials.push(validatedMaterial);
                  }
                }
              }
            }
          }
        }
      } else {
        // Format inconnu
        console.error('Format JSON non reconnu:', jsonData);
        throw new Error('Format de fichier JSON non reconnu. Veuillez utiliser un format compatible.');
      }

      console.log('Données JSON traitées:', {
        materials: materials.length,
        services: services.length,
        materialsData: materials,
        servicesData: services
      });

      return { materials, services };
    } catch (error) {
      console.error('Erreur lors du traitement du fichier JSON:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier JSON');
      return { materials: [], services: [] };
    }
  };

  // Gérer le téléchargement du fichier
  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);

      if (fileList.length === 0) {
        setError('Veuillez sélectionner un fichier à importer');
        return;
      }

      const file = fileList[0].originFileObj;
      if (!file) {
        setError('Fichier invalide');
        return;
      }

      // Traiter le fichier en fonction de son type
      let items: CatalogItemsToImport = { materials: [], services: [] };
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        items = await processExcelFile(file);
      } else if (file.name.endsWith('.json')) {
        items = await processJsonFile(file);
      } else {
        setError('Format de fichier non pris en charge. Veuillez utiliser un fichier Excel (.xlsx, .xls) ou JSON (.json)');
        return;
      }

      // Vérifier si des éléments ont été trouvés
      if (items.materials.length === 0 && items.services.length === 0) {
        setError('Aucun élément valide trouvé dans le fichier');
        return;
      }

      console.log('Éléments à importer:', {
        materials: items.materials.length,
        services: items.services.length,
        materialsData: items.materials,
        servicesData: items.services
      });

      // Définir les éléments à importer et afficher la modale de vérification
      setItemsToImport(items);
      setShowVerification(true);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier');
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'annulation de la vérification
  const handleVerificationCancel = () => {
    setShowVerification(false);
    setItemsToImport({ materials: [], services: [] });
  };

  // Gérer la confirmation de la vérification
  const handleVerificationConfirm = async (materialResolutions: MaterialConflict[], serviceResolutions: ServiceConflict[]) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier que les données à importer sont présentes
      if (itemsToImport.materials.length === 0 && itemsToImport.services.length === 0) {
        throw new Error('Aucun élément à importer');
      }

      // Vérifier que le nom du catalogue est défini
      const finalCatalogName = catalogName || `Catalogue importé ${new Date().toLocaleDateString()}`;

      // Créer une copie profonde des données pour éviter toute modification accidentelle
      const materialsCopy = JSON.parse(JSON.stringify(itemsToImport.materials));
      const servicesCopy = JSON.parse(JSON.stringify(itemsToImport.services));

      // Préparer les données à envoyer
      const importData = {
        name: finalCatalogName,
        description: catalogDescription,
        materials: materialsCopy,
        services: servicesCopy,
        materialResolutions,
        serviceResolutions
      };

      console.log('Données à envoyer à l\'API (DÉTAILLÉ):', JSON.stringify(importData));

      // Envoyer les données au serveur
      const response = await fetch('/api/catalogs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      const responseText = await response.text();
      console.log('Réponse brute de l\'API:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e);
        throw new Error('Réponse invalide du serveur');
      }

      if (!response.ok) {
        console.error('Erreur de réponse API:', result);
        throw new Error(result.error || 'Erreur lors de l\'importation du catalogue');
      }

      console.log('Résultat de l\'importation:', result);

      // Fermer la modale de vérification
      setShowVerification(false);
      
      // Réinitialiser l'état
      setFileList([]);
      setItemsToImport({ materials: [], services: [] });
      setCatalogName('');
      setCatalogDescription('');
      
      // Afficher un message de succès
      message.success(`Catalogue importé avec succès: ${result.data.materialsCount} matériaux et ${result.data.servicesCount} prestations`);
      
      // Fermer la modale principale
      onClose();
      
      // Appeler le callback de succès
      if (result.data.catalog && result.data.catalog.id) {
        onSuccess(result.data.catalog.id);
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation du catalogue:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'importation du catalogue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        title="Importer un catalogue"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <FileExcelOutlined /> Importer depuis Excel
              </span>
            }
            key="excel"
          >
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>Instructions</Title>
              <Text>
                Importez un fichier Excel contenant les matériaux et prestations à ajouter au catalogue.
                Le fichier doit contenir les colonnes suivantes : name, description, category, cost, unit, reference, sellingPrice.
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Button type="link" onClick={handleDownloadExcelExample}>
                  Télécharger un exemple de fichier Excel
                </Button>
              </div>
            </div>
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileTextOutlined /> Importer depuis JSON
              </span>
            }
            key="json"
          >
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>Instructions</Title>
              <Text>
                Importez un fichier JSON contenant les informations du catalogue. Le système prend en charge deux formats :
              </Text>
              <ul className="mt-2 mb-2">
                <li>
                  <Text strong>Nouveau format</Text> : Format plat avec listes de matériaux et prestations directement au niveau racine.
                </li>
                <li>
                  <Text strong>Ancien format</Text> : Format hiérarchique avec catégories, services et matériaux imbriqués.
                </li>
              </ul>
              <Text>
                Les deux formats sont automatiquement détectés et traités correctement.
              </Text>
              <div style={{ marginTop: '8px' }}>
                <Button type="link" onClick={handleDownloadJsonExample}>
                  Télécharger un exemple de fichier JSON
                </Button>
              </div>
            </div>
          </TabPane>
        </Tabs>

        {error && (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Upload
          fileList={fileList}
          onChange={handleFileChange}
          beforeUpload={() => false}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
        </Upload>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: '8px' }}>
            Annuler
          </Button>
          <Button type="primary" onClick={handleUpload} loading={loading}>
            Importer
          </Button>
        </div>
      </Modal>

      <CatalogItemVerification
        visible={showVerification}
        onCancel={handleVerificationCancel}
        onConfirm={handleVerificationConfirm}
        itemsToImport={itemsToImport}
        loading={loading}
      />
    </>
  );
};

export default CatalogImporter; 
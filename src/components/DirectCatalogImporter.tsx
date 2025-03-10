import React, { useState } from 'react';
import { Modal, Upload, Button, message, Typography, Spin, Alert, Input, Form } from 'antd';
import { UploadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface DirectCatalogImporterProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (catalogId: string) => void;
}

interface ProductData {
  name: string;
  description?: string;
  category: 'MATERIAL' | 'SERVICE';
  cost: number;
  unit?: string;
  reference?: string;
  sellingPrice: number;
}

interface CatalogItemsToImport {
  materials: ProductData[];
  services: ProductData[];
}

const DirectCatalogImporter: React.FC<DirectCatalogImporterProps> = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogName, setCatalogName] = useState<string>('');
  const [catalogDescription, setCatalogDescription] = useState<string>('');
  const [itemsToImport, setItemsToImport] = useState<CatalogItemsToImport>({ materials: [], services: [] });
  const [form] = Form.useForm();

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
    const example = {
      name: "Nom du catalogue",
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

    // Télécharger l'exemple
    const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple_import_catalogue.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      const materials: ProductData[] = [];
      const services: ProductData[] = [];

      // Parcourir les lignes du fichier Excel
      for (const row of jsonData) {
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

        // Ajouter au tableau approprié
        if (normalizedRow.category === 'MATERIAL') {
          materials.push(normalizedRow as ProductData);
        } else if (normalizedRow.category === 'SERVICE') {
          services.push(normalizedRow as ProductData);
        }
      }

      console.log('Données Excel traitées:', {
        materials: materials.length,
        services: services.length
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
      let materials: ProductData[] = [];
      let services: ProductData[] = [];

      // Vérifier le format du fichier JSON
      if (jsonData.materials && Array.isArray(jsonData.materials)) {
        // Format avec listes plates de matériaux et prestations
        console.log('Format JSON détecté: format avec listes plates');
        
        // Traiter les matériaux
        materials = jsonData.materials.map((material: any) => ({
          name: material.name,
          description: material.description || null,
          category: 'MATERIAL',
          cost: material.cost || 0,
          unit: material.unit || null,
          reference: material.reference || null,
          sellingPrice: material.sellingPrice || 0
        }));

        // Traiter les prestations
        if (jsonData.services && Array.isArray(jsonData.services)) {
          services = jsonData.services.map((service: any) => ({
            name: service.name,
            description: service.description || null,
            category: 'SERVICE',
            cost: service.cost || 0,
            unit: service.unit || null,
            reference: service.reference || null,
            sellingPrice: service.sellingPrice || 0
          }));
        }
      } else if (jsonData.categories && Array.isArray(jsonData.categories)) {
        // Format hiérarchique avec catégories, services et matériaux
        console.log('Format JSON détecté: format hiérarchique');
        
        // Parcourir les catégories
        for (const category of jsonData.categories) {
          if (category.services && Array.isArray(category.services)) {
            // Parcourir les services de chaque catégorie
            for (const service of category.services) {
              // Ajouter le service comme une prestation
              services.push({
                name: service.name,
                description: service.description || null,
                category: 'SERVICE',
                cost: service.price * 0.7, // Estimation du coût à 70% du prix
                unit: service.unit || null,
                reference: null,
                sellingPrice: service.price || 0
              });

              // Traiter les matériaux du service
              if (service.materials && Array.isArray(service.materials)) {
                for (const material of service.materials) {
                  // Ajouter le matériau
                  materials.push({
                    name: material.name,
                    description: material.description || `Matériau pour ${service.name}`,
                    category: 'MATERIAL',
                    cost: material.price * 0.7, // Estimation du coût à 70% du prix
                    unit: material.unit || null,
                    reference: material.reference || null,
                    sellingPrice: material.price || 0
                  });
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
        services: services.length
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

      // Mettre à jour les éléments à importer
      setItemsToImport(items);

      // Importer directement le catalogue
      await importCatalog(items);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier');
    } finally {
      setLoading(false);
    }
  };

  // Importer le catalogue
  const importCatalog = async (items: CatalogItemsToImport) => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier que les données à importer sont présentes
      if (items.materials.length === 0 && items.services.length === 0) {
        throw new Error('Aucun élément à importer');
      }

      // Vérifier que le nom du catalogue est défini
      const finalCatalogName = catalogName || `Catalogue importé ${new Date().toLocaleDateString()}`;

      // Préparer les données à envoyer
      const importData = {
        name: finalCatalogName,
        description: catalogDescription,
        materials: items.materials,
        services: items.services
      };

      console.log('Données à envoyer à l\'API directe:', {
        name: finalCatalogName,
        description: catalogDescription,
        materialsCount: items.materials.length,
        servicesCount: items.services.length
      });

      // Envoyer les données au serveur
      const response = await fetch('/api/catalogs/import/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de réponse API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de l\'importation du catalogue');
      }

      const result = await response.json();
      console.log('Résultat de l\'importation directe:', result);

      // Réinitialiser l'état
      setFileList([]);
      setItemsToImport({ materials: [], services: [] });
      setCatalogName('');
      setCatalogDescription('');
      form.resetFields();
      
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
    <Modal
      title="Importer un catalogue (Méthode directe)"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Nom du catalogue" required>
          <Input 
            value={catalogName} 
            onChange={(e) => setCatalogName(e.target.value)} 
            placeholder="Nom du catalogue"
          />
        </Form.Item>
        
        <Form.Item label="Description du catalogue">
          <TextArea 
            value={catalogDescription} 
            onChange={(e) => setCatalogDescription(e.target.value)} 
            placeholder="Description du catalogue"
            rows={3}
          />
        </Form.Item>

        <Form.Item label="Fichier à importer" required>
          <Upload
            accept=".xlsx,.xls,.json"
            fileList={fileList}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
          </Upload>
          
          <div style={{ marginTop: 16 }}>
            <Text>Formats acceptés: Excel (.xlsx, .xls) ou JSON (.json)</Text>
            <div style={{ marginTop: 8 }}>
              <Button 
                type="link" 
                icon={<FileExcelOutlined />} 
                onClick={handleDownloadExcelExample}
              >
                Télécharger un exemple Excel
              </Button>
              <Button 
                type="link" 
                icon={<FileTextOutlined />} 
                onClick={handleDownloadJsonExample}
              >
                Télécharger un exemple JSON
              </Button>
            </div>
          </div>
        </Form.Item>

        {error && (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Annuler
          </Button>
          <Button 
            type="primary" 
            onClick={handleUpload} 
            loading={loading}
            disabled={fileList.length === 0 || !catalogName}
          >
            Importer
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DirectCatalogImporter; 
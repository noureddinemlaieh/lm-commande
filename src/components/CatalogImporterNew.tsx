import React, { useState } from 'react';
import { Modal, Upload, Button, message, Typography, Spin, Alert, Input, Form } from 'antd';
import { UploadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import * as XLSX from 'xlsx';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface CatalogImporterProps {
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

interface CatalogData {
  name: string;
  description?: string;
  materials: ProductData[];
  services: ProductData[];
  categories?: string[];
}

const CatalogImporterNew: React.FC<CatalogImporterProps> = ({ visible, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogName, setCatalogName] = useState<string>('');
  const [catalogDescription, setCatalogDescription] = useState<string>('');
  const [form] = Form.useForm();

  // Gérer le changement de fichier
  const handleFileChange: UploadProps['onChange'] = (info) => {
    setFileList(info.fileList.slice(-1)); // Garder seulement le dernier fichier
    setError(null);
    
    // Si un fichier est sélectionné, extraire le nom du catalogue
    if (info.fileList.length > 0 && info.fileList[0].name) {
      const fileName = info.fileList[0].name.split('.')[0];
      setCatalogName(fileName);
    }
  };

  // Télécharger un exemple de fichier Excel
  const handleDownloadExcelExample = () => {
    // Créer un exemple de données
    const exampleData = [
      {
        name: 'Nom du produit',
        description: 'Description du produit',
        category: 'MATERIAL',
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
    // Exemple au format d'importation standard
    const standardExample = {
      name: "Nom du catalogue",
      description: "Description du catalogue",
      categories: [
        "Mise en protection et ménage de fin des travaux",
        "CLOISON",
        "Électricité",
        "Plomberie",
        "Peinture"
      ],
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

    // Exemple au format d'exportation
    const exportExample = {
      id: "export-example-id",
      name: "Catalogue exporté",
      categories: [
        {
          id: "cat1",
          name: "Mise en protection et ménage de fin des travaux",
          materials: [
            {
              id: "mat1",
              name: "Bâche de protection plastifiée",
              reference: "REF123",
              price: 150,
              quantity: 1,
              unit: "u",
              dimensions: "L.10 x l.0.9 m"
            },
            {
              id: "mat2",
              name: "Sac à gravats",
              reference: "REF456",
              price: 7,
              quantity: 20,
              unit: "u",
              dimensions: "H.100 x l.60 cm x Ep.120 μm"
            }
          ]
        },
        {
          id: "cat2",
          name: "CLOISON",
          materials: [
            {
              id: "mat3",
              name: "Plaque de plâtre",
              reference: "REF789",
              price: 14,
              quantity: 1,
              unit: "m²"
            }
          ]
        }
      ]
    };

    // Demander à l'utilisateur quel format il souhaite télécharger
    Modal.confirm({
      title: 'Choisir le format d&apos;exemple',
      content: (
        <div>
          <p>Veuillez choisir le format d&apos;exemple à télécharger :</p>
          <ul>
            <li><strong>Format standard</strong> : Format avec listes de matériaux et prestations</li>
            <li><strong>Format d&apos;exportation</strong> : Format compatible avec l&apos;exportation de catalogues</li>
          </ul>
        </div>
      ),
      okText: 'Format standard',
      cancelText: 'Format d&apos;exportation',
      onOk() {
        // Télécharger l'exemple au format standard
        const blob = new Blob([JSON.stringify(standardExample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exemple_import_catalogue_standard.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      onCancel() {
        // Télécharger l'exemple au format d'exportation
        const blob = new Blob([JSON.stringify(exportExample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exemple_import_catalogue_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  // Traiter le fichier Excel
  const processExcelFile = async (file: File): Promise<CatalogData> => {
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

      // Initialiser les tableaux pour les matériaux et les prestations
      const materials: ProductData[] = [];
      const services: ProductData[] = [];

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
          category: ((row['category'] || row['Category'] || row['CATEGORY'] || 'MATERIAL') + '').toUpperCase(),
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

      return {
        name: catalogName,
        description: catalogDescription,
        materials,
        services
      };
    } catch (error) {
      console.error('Erreur lors du traitement du fichier Excel:', error);
      throw error;
    }
  };

  // Traiter le fichier JSON
  const processJsonFile = async (file: File): Promise<CatalogData> => {
    try {
      // Lire le fichier JSON
      const text = await file.text();
      const jsonData = JSON.parse(text);

      console.log('Données JSON brutes:', jsonData);

      // Extraire le nom et la description du catalogue
      const name = jsonData.name || catalogName;
      const description = jsonData.description || catalogDescription;
      const categories = jsonData.categories ? jsonData.categories.map((cat: any) => cat.name) : [];

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
        // Format d'exportation ou format hiérarchique
        console.log('Format JSON détecté: format hiérarchique ou d&apos;exportation');
        
        // Parcourir les catégories
        for (const category of jsonData.categories) {
          // Vérifier si c&aposest le format d&aposexportation (avec materials) ou le format hiérarchique (avec services)
          if (category.materials && Array.isArray(category.materials)) {
            // Format d&aposexportation
            console.log('Format d&aposexportation détecté');
            
            // Parcourir les matériaux de chaque catégorie
            for (const material of category.materials) {
              // Ajouter le matériau
              materials.push({
                name: material.name,
                description: `Matériau de ${category.name}`,
                category: 'MATERIAL',
                cost: material.price * 0.7, // Estimation du coût à 70% du prix
                unit: material.unit || null,
                reference: material.reference || null,
                sellingPrice: material.price || 0
              });
              
              // Créer également un service pour ce matériau
              services.push({
                name: `Fourniture de ${material.name}`,
                description: `Fourniture de ${material.name} pour ${category.name}`,
                category: 'SERVICE',
                cost: material.price * 0.7, // Estimation du coût à 70% du prix
                unit: material.unit || null,
                reference: material.reference || null,
                sellingPrice: material.price || 0
              });
            }
          } else if (category.services && Array.isArray(category.services)) {
            // Format hiérarchique
            console.log('Format hiérarchique détecté');
            
            // Parcourir les services de chaque catégorie
            for (const service of category.services) {
              // Ajouter le service comme une prestation
              services.push({
                name: service.name,
                description: service.description || null,
                category: 'SERVICE',
                cost: service.price * 0.7, // Estimation du coût à 70% du prix
                unit: service.unit || '',
                reference: '',
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
        services: services.length,
        categories: categories.length
      });

      return {
        name,
        description,
        materials,
        services,
        categories
      };
    } catch (error) {
      console.error('Erreur lors du traitement du fichier JSON:', error);
      throw error;
    }
  };

  // Gérer l'importation du catalogue
  const handleImport = async () => {
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

      // Vérifier que le nom du catalogue est défini
      if (!catalogName.trim()) {
        setError('Le nom du catalogue est requis');
        return;
      }

      // Traiter le fichier en fonction de son type
      let catalogData: CatalogData;
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        catalogData = await processExcelFile(file);
      } else if (file.name.endsWith('.json')) {
        catalogData = await processJsonFile(file);
      } else {
        setError('Format de fichier non pris en charge. Veuillez utiliser un fichier Excel (.xlsx, .xls) ou JSON (.json)');
        return;
      }

      // Vérifier si des éléments ont été trouvés
      if (catalogData.materials.length === 0 && catalogData.services.length === 0) {
        setError('Aucun élément valide trouvé dans le fichier');
        return;
      }

      // Mettre à jour le nom et la description du catalogue
      catalogData.name = catalogName;
      catalogData.description = catalogDescription;

      console.log('Données à envoyer à l&aposAPI:', {
        name: catalogData.name,
        description: catalogData.description,
        materialsCount: catalogData.materials.length,
        servicesCount: catalogData.services.length,
        categoriesCount: catalogData.categories?.length || 0
      });

      // Envoyer les données au serveur
      const response = await fetch('/api/catalogs/import/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(catalogData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de réponse API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de l&aposimportation du catalogue');
      }

      const result = await response.json();
      console.log('Résultat de l&aposimportation:', result);

      // Réinitialiser l&aposétat
      setFileList([]);
      setCatalogName('');
      setCatalogDescription('');
      form.resetFields();
      
      // Afficher un message de succès
      message.success(`Catalogue importé avec succès: ${result.data.materialsCount} matériaux et ${result.data.servicesCount} prestations`);
      
      // Fermer la modale
      onClose();
      
      // Appeler le callback de succès
      if (result.data.catalog && result.data.catalog.id) {
        onSuccess(result.data.catalog.id);
      }
    } catch (error) {
      console.error('Erreur lors de l&aposimportation du catalogue:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de l&aposimportation du catalogue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Importer un catalogue"
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
            onClick={handleImport} 
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

export default CatalogImporterNew; 
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Radio, Space, Typography, Spin, Alert, Tabs, Badge } from 'antd';
import { ValidatedProductData } from '@/types/ImportTypes';
import { ExistingMaterial, MaterialConflict } from './MaterialImportVerification';

const { Text } = Typography;
const { TabPane } = Tabs;

// Interface pour les prestations existantes
export interface ExistingService extends ExistingMaterial {
  // Même structure que ExistingMaterial mais avec une catégorie différente
}

// Interface pour les conflits de prestations
export interface ServiceConflict extends MaterialConflict {
  // Même structure que MaterialConflict mais avec des types différents
  existingMaterial: ExistingService;
}

// Interface pour les éléments du catalogue à importer
export interface CatalogItemsToImport {
  materials: ValidatedProductData[];
  services: ValidatedProductData[];
}

interface CatalogItemVerificationProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (materialResolutions: MaterialConflict[], serviceResolutions: ServiceConflict[]) => Promise<void>;
  itemsToImport: CatalogItemsToImport;
  loading: boolean;
}

const CatalogItemVerification: React.FC<CatalogItemVerificationProps> = ({
  visible,
  onCancel,
  onConfirm,
  itemsToImport,
  loading
}) => {
  const [materialConflicts, setMaterialConflicts] = useState<MaterialConflict[]>([]);
  const [serviceConflicts, setServiceConflicts] = useState<ServiceConflict[]>([]);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('materials');

  // Vérifier les conflits lors du chargement des éléments à importer
  useEffect(() => {
    if (visible && (itemsToImport.materials.length > 0 || itemsToImport.services.length > 0)) {
      checkForConflicts();
    }
  }, [visible, itemsToImport]);

  // Fonction pour vérifier les conflits avec les éléments existants
  const checkForConflicts = async () => {
    try {
      setVerificationLoading(true);
      setError(null);

      // Vérifier les conflits de matériaux
      if (itemsToImport.materials.length > 0) {
        await checkMaterialConflicts();
      }

      // Vérifier les conflits de prestations
      if (itemsToImport.services.length > 0) {
        await checkServiceConflicts();
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des conflits:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification des conflits');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Vérifier les conflits de matériaux
  const checkMaterialConflicts = async () => {
    // Récupérer tous les matériaux existants
    const response = await fetch('/api/products?category=MATERIAL');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des matériaux existants');
    }

    const existingMaterials: ExistingMaterial[] = await response.json();
    
    // Identifier les conflits (matériaux avec le même nom ou la même référence)
    const newConflicts: MaterialConflict[] = [];
    
    for (const importMaterial of itemsToImport.materials) {
      const matchingMaterials = existingMaterials.filter(existing => 
        existing.name.toLowerCase() === importMaterial.name.toLowerCase() ||
        (existing.reference && importMaterial.reference && 
         existing.reference.toLowerCase() === importMaterial.reference.toLowerCase())
      );
      
      if (matchingMaterials.length > 0) {
        // Créer un conflit pour chaque matériau correspondant
        for (const existingMaterial of matchingMaterials) {
          newConflicts.push({
            importMaterial,
            existingMaterial,
            resolution: null
          });
        }
      }
    }
    
    setMaterialConflicts(newConflicts);
  };

  // Vérifier les conflits de prestations
  const checkServiceConflicts = async () => {
    // Récupérer toutes les prestations existantes
    const response = await fetch('/api/products?category=SERVICE');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des prestations existantes');
    }

    const existingServices: ExistingService[] = await response.json();
    
    // Identifier les conflits (prestations avec le même nom)
    const newConflicts: ServiceConflict[] = [];
    
    for (const importService of itemsToImport.services) {
      const matchingServices = existingServices.filter(existing => 
        existing.name.toLowerCase() === importService.name.toLowerCase()
      );
      
      if (matchingServices.length > 0) {
        // Créer un conflit pour chaque prestation correspondante
        for (const existingService of matchingServices) {
          newConflicts.push({
            importMaterial: importService,
            existingMaterial: existingService,
            resolution: null
          });
        }
      }
    }
    
    setServiceConflicts(newConflicts);
  };

  // Mettre à jour la résolution d'un conflit de matériau
  const handleMaterialResolutionChange = (conflictIndex: number, resolution: 'import' | 'skip' | 'update') => {
    setMaterialConflicts(prevConflicts => {
      const updatedConflicts = [...prevConflicts];
      updatedConflicts[conflictIndex] = {
        ...updatedConflicts[conflictIndex],
        resolution
      };
      return updatedConflicts;
    });
  };

  // Mettre à jour la résolution d'un conflit de prestation
  const handleServiceResolutionChange = (conflictIndex: number, resolution: 'import' | 'skip' | 'update') => {
    setServiceConflicts(prevConflicts => {
      const updatedConflicts = [...prevConflicts];
      updatedConflicts[conflictIndex] = {
        ...updatedConflicts[conflictIndex],
        resolution
      };
      return updatedConflicts;
    });
  };

  // Appliquer la même résolution à tous les conflits de matériaux
  const handleApplyToAllMaterials = (resolution: 'import' | 'skip' | 'update') => {
    setMaterialConflicts(prevConflicts => 
      prevConflicts.map(conflict => ({
        ...conflict,
        resolution
      }))
    );
  };

  // Appliquer la même résolution à tous les conflits de prestations
  const handleApplyToAllServices = (resolution: 'import' | 'skip' | 'update') => {
    setServiceConflicts(prevConflicts => 
      prevConflicts.map(conflict => ({
        ...conflict,
        resolution
      }))
    );
  };

  // Confirmer les résolutions et procéder à l'importation
  const handleConfirm = async () => {
    // Vérifier que tous les conflits ont une résolution
    const unresolvedMaterialConflicts = materialConflicts.filter(conflict => conflict.resolution === null);
    const unresolvedServiceConflicts = serviceConflicts.filter(conflict => conflict.resolution === null);
    
    if (unresolvedMaterialConflicts.length > 0 || unresolvedServiceConflicts.length > 0) {
      const unresolvedCount = unresolvedMaterialConflicts.length + unresolvedServiceConflicts.length;
      setError(`Veuillez résoudre tous les conflits (${unresolvedCount} non résolus)`);
      
      // Basculer vers l'onglet contenant des conflits non résolus
      if (unresolvedMaterialConflicts.length > 0) {
        setActiveTab('materials');
      } else if (unresolvedServiceConflicts.length > 0) {
        setActiveTab('services');
      }
      
      return;
    }

    try {
      setConfirmLoading(true);
      console.log('Données à importer avant confirmation:', {
        materials: itemsToImport.materials.length,
        services: itemsToImport.services.length,
        materialConflicts: materialConflicts.length,
        serviceConflicts: serviceConflicts.length
      });
      
      // Créer des copies profondes pour éviter toute modification accidentelle
      const materialConflictsCopy = JSON.parse(JSON.stringify(materialConflicts));
      const serviceConflictsCopy = JSON.parse(JSON.stringify(serviceConflicts));
      
      await onConfirm(materialConflictsCopy, serviceConflictsCopy);
    } catch (err) {
      console.error('Erreur lors de la confirmation des résolutions:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la confirmation des résolutions');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Colonnes pour le tableau de comparaison
  const columns = [
    {
      title: 'Propriété',
      dataIndex: 'property',
      key: 'property',
      width: '20%',
    },
    {
      title: 'Élément existant',
      dataIndex: 'existing',
      key: 'existing',
      width: '40%',
      render: (text: string, record: any) => (
        <Text type={record.different ? 'danger' : undefined}>{text}</Text>
      ),
    },
    {
      title: 'Élément à importer',
      dataIndex: 'import',
      key: 'import',
      width: '40%',
      render: (text: string, record: any) => (
        <Text type={record.different ? 'danger' : undefined}>{text}</Text>
      ),
    },
  ];

  // Générer les données pour le tableau de comparaison
  const getComparisonData = (conflict: MaterialConflict | ServiceConflict) => {
    const { existingMaterial, importMaterial } = conflict;
    
    const formatValue = (value: any) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') return value.toString();
      return value;
    };
    
    const compareValues = (value1: any, value2: any) => {
      if (value1 === null && value2 === null) return false;
      if (value1 === null || value2 === null) return true;
      return value1 !== value2;
    };
    
    return [
      {
        key: 'name',
        property: 'Nom',
        existing: formatValue(existingMaterial.name),
        import: formatValue(importMaterial.name),
        different: compareValues(existingMaterial.name, importMaterial.name),
      },
      {
        key: 'description',
        property: 'Description',
        existing: formatValue(existingMaterial.description),
        import: formatValue(importMaterial.description),
        different: compareValues(existingMaterial.description, importMaterial.description),
      },
      {
        key: 'reference',
        property: 'Référence',
        existing: formatValue(existingMaterial.reference),
        import: formatValue(importMaterial.reference),
        different: compareValues(existingMaterial.reference, importMaterial.reference),
      },
      {
        key: 'cost',
        property: 'Coût',
        existing: formatValue(existingMaterial.cost),
        import: formatValue(importMaterial.cost),
        different: compareValues(existingMaterial.cost, importMaterial.cost),
      },
      {
        key: 'unit',
        property: 'Unité',
        existing: formatValue(existingMaterial.unit),
        import: formatValue(importMaterial.unit),
        different: compareValues(existingMaterial.unit, importMaterial.unit),
      },
      {
        key: 'sellingPrice',
        property: 'Prix de vente',
        existing: formatValue(existingMaterial.sellingPrice),
        import: formatValue(importMaterial.sellingPrice),
        different: compareValues(existingMaterial.sellingPrice, importMaterial.sellingPrice),
      },
    ];
  };

  // Rendu des conflits de matériaux
  const renderMaterialConflicts = () => {
    if (materialConflicts.length === 0) {
      return (
        <Alert
          message="Aucun conflit détecté"
          description="Tous les matériaux peuvent être importés sans conflit avec les matériaux existants."
          type="success"
          showIcon
        />
      );
    }

    return (
      <>
        <Alert
          message={`${materialConflicts.length} conflit(s) détecté(s)`}
          description="Certains matériaux à importer ont le même nom ou la même référence que des matériaux existants. Veuillez choisir comment résoudre chaque conflit."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Text strong>Appliquer à tous :</Text>
            <Button onClick={() => handleApplyToAllMaterials('import')}>Importer comme nouveau</Button>
            <Button onClick={() => handleApplyToAllMaterials('update')}>Mettre à jour l&apos;existant</Button>
            <Button onClick={() => handleApplyToAllMaterials('skip')}>Ignorer</Button>
          </Space>
        </div>

        {materialConflicts.map((conflict, index) => (
          <div key={index} style={{ marginBottom: '24px', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '4px' }}>
            <Typography.Title level={5}>
              Conflit #{index + 1}: {conflict.importMaterial.name}
            </Typography.Title>
            
            <Table
              columns={columns}
              dataSource={getComparisonData(conflict)}
              pagination={false}
              size="small"
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ marginTop: '16px' }}>
              <Radio.Group
                value={conflict.resolution}
                onChange={(e) => handleMaterialResolutionChange(index, e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="import">
                    Importer comme nouveau matériau (créer un doublon)
                  </Radio>
                  <Radio value="update">
                    Mettre à jour le matériau existant avec les nouvelles valeurs
                  </Radio>
                  <Radio value="skip">
                    Ignorer ce matériau (ne pas l'importer)
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          </div>
        ))}
      </>
    );
  };

  // Rendu des conflits de prestations
  const renderServiceConflicts = () => {
    if (serviceConflicts.length === 0) {
      return (
        <Alert
          message="Aucun conflit détecté"
          description="Toutes les prestations peuvent être importées sans conflit avec les prestations existantes."
          type="success"
          showIcon
        />
      );
    }

    return (
      <>
        <Alert
          message={`${serviceConflicts.length} conflit(s) détecté(s)`}
          description="Certaines prestations à importer ont le même nom que des prestations existantes. Veuillez choisir comment résoudre chaque conflit."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Text strong>Appliquer à tous :</Text>
            <Button onClick={() => handleApplyToAllServices('import')}>Importer comme nouvelle</Button>
            <Button onClick={() => handleApplyToAllServices('update')}>Mettre à jour l'existante</Button>
            <Button onClick={() => handleApplyToAllServices('skip')}>Ignorer</Button>
          </Space>
        </div>

        {serviceConflicts.map((conflict, index) => (
          <div key={index} style={{ marginBottom: '24px', border: '1px solid #f0f0f0', padding: '16px', borderRadius: '4px' }}>
            <Typography.Title level={5}>
              Conflit #{index + 1}: {conflict.importMaterial.name}
            </Typography.Title>
            
            <Table
              columns={columns}
              dataSource={getComparisonData(conflict)}
              pagination={false}
              size="small"
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ marginTop: '16px' }}>
              <Radio.Group
                value={conflict.resolution}
                onChange={(e) => handleServiceResolutionChange(index, e.target.value)}
              >
                <Space direction="vertical">
                  <Radio value="import">
                    Importer comme nouvelle prestation (créer un doublon)
                  </Radio>
                  <Radio value="update">
                    Mettre à jour la prestation existante avec les nouvelles valeurs
                  </Radio>
                  <Radio value="skip">
                    Ignorer cette prestation (ne pas l'importer)
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          </div>
        ))}
      </>
    );
  };

  // Compter les conflits non résolus
  const unresolvedMaterialCount = materialConflicts.filter(c => c.resolution === null).length;
  const unresolvedServiceCount = serviceConflicts.filter(c => c.resolution === null).length;

  return (
    <Modal
      title="Vérification des éléments du catalogue avant importation"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Annuler
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmLoading}
          onClick={handleConfirm}
          disabled={verificationLoading || unresolvedMaterialCount > 0 || unresolvedServiceCount > 0}
        >
          Confirmer et importer
        </Button>,
      ]}
    >
      {loading || verificationLoading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '10px' }}>Vérification des éléments du catalogue...</p>
        </div>
      ) : (
        <>
          {error && (
            <Alert
              message="Erreur"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={
                <span>
                  Matériaux
                  {unresolvedMaterialCount > 0 && (
                    <Badge count={unresolvedMaterialCount} style={{ marginLeft: 8 }} />
                  )}
                </span>
              } 
              key="materials"
            >
              {renderMaterialConflicts()}
            </TabPane>
            <TabPane 
              tab={
                <span>
                  Prestations
                  {unresolvedServiceCount > 0 && (
                    <Badge count={unresolvedServiceCount} style={{ marginLeft: 8 }} />
                  )}
                </span>
              } 
              key="services"
            >
              {renderServiceConflicts()}
            </TabPane>
          </Tabs>
        </>
      )}
    </Modal>
  );
};

export default CatalogItemVerification; 
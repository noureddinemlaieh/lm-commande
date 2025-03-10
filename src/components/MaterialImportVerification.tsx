import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Radio, Space, Typography, Spin, Alert } from 'antd';
import { ValidatedProductData } from '@/types/ImportTypes';

const { Text } = Typography;

export interface ExistingMaterial {
  id: string;
  name: string;
  description: string | null;
  category: 'SERVICE' | 'MATERIAL';
  cost: number;
  unit: string | null;
  reference: string | null;
  sellingPrice: number;
}

export interface MaterialConflict {
  importMaterial: ValidatedProductData;
  existingMaterial: ExistingMaterial;
  resolution: 'import' | 'skip' | 'update' | null;
}

interface MaterialImportVerificationProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (resolutions: MaterialConflict[]) => Promise<void>;
  materialsToImport: ValidatedProductData[];
  loading: boolean;
}

const MaterialImportVerification: React.FC<MaterialImportVerificationProps> = ({
  visible,
  onCancel,
  onConfirm,
  materialsToImport,
  loading
}) => {
  const [conflicts, setConflicts] = useState<MaterialConflict[]>([]);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier les conflits lors du chargement des matériaux à importer
  useEffect(() => {
    if (visible && materialsToImport.length > 0) {
      checkForConflicts();
    }
  }, [visible, materialsToImport]);

  // Fonction pour vérifier les conflits avec les matériaux existants
  const checkForConflicts = async () => {
    try {
      setVerificationLoading(true);
      setError(null);

      // Récupérer tous les matériaux existants
      const response = await fetch('/api/products?category=MATERIAL');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des matériaux existants');
      }

      const existingMaterials: ExistingMaterial[] = await response.json();
      
      // Identifier les conflits (matériaux avec le même nom ou la même référence)
      const newConflicts: MaterialConflict[] = [];
      
      for (const importMaterial of materialsToImport) {
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
      
      setConflicts(newConflicts);
    } catch (err) {
      console.error('Erreur lors de la vérification des conflits:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification des conflits');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Mettre à jour la résolution d'un conflit
  const handleResolutionChange = (conflictIndex: number, resolution: 'import' | 'skip' | 'update') => {
    setConflicts(prevConflicts => {
      const updatedConflicts = [...prevConflicts];
      updatedConflicts[conflictIndex] = {
        ...updatedConflicts[conflictIndex],
        resolution
      };
      return updatedConflicts;
    });
  };

  // Appliquer la même résolution à tous les conflits
  const handleApplyToAll = (resolution: 'import' | 'skip' | 'update') => {
    setConflicts(prevConflicts => 
      prevConflicts.map(conflict => ({
        ...conflict,
        resolution
      }))
    );
  };

  // Confirmer les résolutions et procéder à l'importation
  const handleConfirm = async () => {
    // Vérifier que tous les conflits ont une résolution
    const unresolvedConflicts = conflicts.filter(conflict => conflict.resolution === null);
    if (unresolvedConflicts.length > 0) {
      setError(`Veuillez résoudre tous les conflits (${unresolvedConflicts.length} non résolus)`);
      return;
    }

    try {
      setConfirmLoading(true);
      await onConfirm(conflicts);
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
      title: 'Matériau existant',
      dataIndex: 'existing',
      key: 'existing',
      width: '40%',
      render: (text: string, record: any) => (
        <Text type={record.different ? 'danger' : undefined}>{text}</Text>
      ),
    },
    {
      title: 'Matériau à importer',
      dataIndex: 'import',
      key: 'import',
      width: '40%',
      render: (text: string, record: any) => (
        <Text type={record.different ? 'danger' : undefined}>{text}</Text>
      ),
    },
  ];

  // Générer les données pour le tableau de comparaison
  const getComparisonData = (conflict: MaterialConflict) => {
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

  return (
    <Modal
      title="Vérification des matériaux avant importation"
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
          disabled={verificationLoading || conflicts.some(c => c.resolution === null)}
        >
          Confirmer et importer
        </Button>,
      ]}
    >
      {loading || verificationLoading ? (
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '10px' }}>Vérification des matériaux...</p>
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

          {conflicts.length === 0 ? (
            <Alert
              message="Aucun conflit détecté"
              description="Tous les matériaux peuvent être importés sans conflit avec les matériaux existants."
              type="success"
              showIcon
            />
          ) : (
            <>
              <Alert
                message={`${conflicts.length} conflit(s) détecté(s)`}
                description="Certains matériaux à importer ont le même nom ou la même référence que des matériaux existants. Veuillez choisir comment résoudre chaque conflit."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <Text strong>Appliquer à tous :</Text>
                  <Button onClick={() => handleApplyToAll('import')}>Importer comme nouveau</Button>
                  <Button onClick={() => handleApplyToAll('update')}>Mettre à jour l'existant</Button>
                  <Button onClick={() => handleApplyToAll('skip')}>Ignorer</Button>
                </Space>
              </div>

              {conflicts.map((conflict, index) => (
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
                      onChange={(e) => handleResolutionChange(index, e.target.value)}
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
          )}
        </>
      )}
    </Modal>
  );
};

export default MaterialImportVerification; 
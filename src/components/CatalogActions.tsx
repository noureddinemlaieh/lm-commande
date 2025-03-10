import React, { useState } from 'react';
import { Button, Modal, Upload, message } from 'antd';
import { UploadOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { exportCatalog, downloadCatalogAsJson, importCatalog } from '../services/catalogExportImport';
import { useNavigate } from 'react-router-dom';

interface CatalogActionsProps {
  catalogId?: string;
  isDetailView?: boolean;
}

const CatalogActions: React.FC<CatalogActionsProps> = ({ catalogId, isDetailView = false }) => {
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const navigate = useNavigate();

  const handleExport = async () => {
    if (!catalogId) return;
    
    try {
      const exportedData = await exportCatalog(catalogId);
      downloadCatalogAsJson(exportedData);
      message.success('Catalogue exporté avec succès');
    } catch (error) {
      message.error('Erreur lors de l\'export du catalogue');
      console.error(error);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const newCatalogId = await importCatalog(file);
      message.success('Catalogue importé avec succès');
      setIsImportModalVisible(false);
      navigate(`/catalog/${newCatalogId}`);
    } catch (error) {
      message.error('Erreur lors de l\'import du catalogue');
      console.error(error);
    }
    return false;
  };

  if (isDetailView) {
    return (
      <Button 
        icon={<ExportOutlined />} 
        onClick={handleExport} 
        type="primary"
      >
        Exporter
      </Button>
    );
  }

  return (
    <>
      <Button 
        icon={<ImportOutlined />} 
        onClick={() => setIsImportModalVisible(true)}
        type="primary"
      >
        Importer
      </Button>

      <Modal
        title="Importer un catalogue"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
      >
        <Upload.Dragger
          name="file"
          accept=".json"
          beforeUpload={(file) => handleImport(file)}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">Cliquez ou glissez-déposez un fichier JSON</p>
        </Upload.Dragger>
      </Modal>
    </>
  );
};

export default CatalogActions; 
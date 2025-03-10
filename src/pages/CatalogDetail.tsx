import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card, List, Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import CatalogActions from '../components/CatalogActions';

const { Title, Text } = Typography;

const CatalogDetail: React.FC = () => {
  const { id: catalogId } = useParams<{ id: string }>();
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data } = await axios.get(`/api/catalogs/${catalogId}`);
        setCatalog(data);
      } catch (error) {
        console.error('Erreur lors du chargement du catalogue:', error);
      } finally {
        setLoading(false);
      }
    };

    if (catalogId) {
      fetchCatalog();
    }
  }, [catalogId]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!catalog) {
    return <div>Catalogue non trouvé</div>;
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Link to="/catalogs">
              <Button icon={<ArrowLeftOutlined />}>Retour</Button>
            </Link>
            <Title level={2} style={{ margin: 0 }}>
              Catalogue: {catalog.name}
            </Title>
          </Space>
          <CatalogActions catalogId={catalogId} isDetailView={true} />
        </div>

        {/* Reste du contenu du catalogue */}
      </Space>
    </div>
  );
};

export default CatalogDetail; 
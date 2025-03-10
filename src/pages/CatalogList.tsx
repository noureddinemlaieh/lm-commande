import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, List, Typography, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import CatalogActions from '../components/CatalogActions';

const { Title } = Typography;

const CatalogList: React.FC = () => {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const { data } = await axios.get('/api/catalogs');
        setCatalogs(data);
      } catch (error) {
        console.error('Erreur lors du chargement des catalogues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const handleCreateCatalog = async () => {
    try {
      const { data } = await axios.post('/api/catalogs', {
        name: `Nouveau catalogue ${new Date().toLocaleDateString()}`
      });
      setCatalogs([...catalogs, data]);
    } catch (error) {
      console.error('Erreur lors de la création du catalogue:', error);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Catalogues</Title>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateCatalog}
            >
              Nouveau catalogue
            </Button>
            <CatalogActions />
          </Space>
        </div>

        <List
          loading={loading}
          grid={{ gutter: 16, column: 3 }}
          dataSource={catalogs}
          renderItem={(catalog) => (
            <List.Item>
              <Card title={catalog.name}>
                <Link to={`/catalog/${catalog.id}`}>
                  <Button type="primary">Voir le détail</Button>
                </Link>
              </Card>
            </List.Item>
          )}
        />
      </Space>
    </div>
  );
};

export default CatalogList; 
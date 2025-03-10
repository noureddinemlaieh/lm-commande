import { useState } from 'react';
import { Form, Card, Input } from 'antd';
import { Catalog } from '@/types/Catalog';

interface DevisFormProps {
  initialData: {
    numero: string;
    year: number;
    number: number;
  };
  catalogs: Catalog[];
  hideCatalogSelect?: boolean;
}

export default function DevisForm({ initialData, catalogs, hideCatalogSelect }: DevisFormProps) {
  return (
    <div>
      <Card>
        <Form layout="vertical">
          <h2>Informations Client</h2>
          {!hideCatalogSelect && (
            <Form.Item label="Catalogue">
              {/* ... contenu du champ catalogue ... */}
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
} 
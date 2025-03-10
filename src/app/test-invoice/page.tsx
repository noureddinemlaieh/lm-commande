'use client';

import { useState } from 'react';
import { Button, Input, Card, Spin } from 'antd';

export default function TestInvoicePage() {
  const [id, setId] = useState('cm7pd8sfv00mvs9w8moyatsrj');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test 1: Vérifier si la facture existe
      const checkResponse = await fetch(`/api/invoices/check?id=${id}`);
      const checkData = await checkResponse.json();
      
      if (!checkData.exists) {
        setError(`La facture avec l'ID ${id} n'existe pas dans la base de données`);
        setResult(checkData);
        return;
      }
      
      // Test 2: Essayer de récupérer la facture
      const response = await fetch(`/api/invoices/${id}`);
      const data = await response.json();
      
      setResult(data);
    } catch (error) {
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card title="Test de récupération de facture">
        <div className="mb-4">
          <Input 
            value={id} 
            onChange={(e) => setId(e.target.value)} 
            placeholder="ID de la facture"
            className="mb-2"
          />
          <Button 
            type="primary" 
            onClick={testInvoice} 
            loading={loading}
          >
            Tester
          </Button>
        </div>
        
        {loading && <Spin />}
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            {error}
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-gray-100 rounded">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
} 
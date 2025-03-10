'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { CreateInvoiceFromDevis } from '@/components/CreateInvoiceFromDevis';

export default function DevisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  useEffect(() => {
    const loadDevis = async () => {
      try {
        const response = await fetch(`/api/devis/${params.id}`);
        const data = await response.json();
        
        // Formater la date d'expiration au format YYYY-MM-DD
        if (data.expirationDate) {
          // Si la date est au format DD/MM/YYYY, la convertir en YYYY-MM-DD
          if (data.expirationDate.includes('/')) {
            const [day, month, year] = data.expirationDate.split('/');
            data.expirationDate = `${year}-${month}-${day}`;
          }
        }
        
        router.push(`/devis/${params.id}/edit`);
      } catch (error) {
        console.error('Erreur lors du chargement du devis:', error);
      }
    };

    if (params.id) {
      loadDevis();
    }
  }, [params.id, router]);

  return (
    <>
      <Button
        onClick={() => setShowCreateInvoiceModal(true)}
      >
        <FileTextOutlined /> Créer une facture
      </Button>
      <CreateInvoiceFromDevis 
        devisId={params.id}
        isOpen={showCreateInvoiceModal}
        onClose={() => setShowCreateInvoiceModal(false)}
      />
    </>
  );
} 
'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Select, DatePicker, message, Spin, Checkbox } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { PAYMENT_METHODS } from '@/types/payment';
import { INVOICE_STATUSES, PAYMENT_STATUSES } from '@/types/Invoice';

interface CreateInvoiceFromDevisProps {
  devisId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceFromDevis: React.FC<CreateInvoiceFromDevisProps> = ({
  devisId,
  isOpen,
  onClose
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [devisData, setDevisData] = useState<any>(null);
  const router = useRouter();
  
  // Charger les données du devis
  useEffect(() => {
    if (isOpen && devisId) {
      const fetchDevis = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/devis/${devisId}`);
          if (!response.ok) throw new Error('Erreur lors du chargement du devis');
          const data = await response.json();
          console.log("Données du devis chargées:", data);
          setDevisData(data);
          
          // Initialiser le formulaire avec les données du devis
          form.setFieldsValue({
            clientId: data.clientId,
            paymentMethod: data.paymentMethod || 'Virement bancaire',
            dueDate: data.expirationDate ? dayjs(data.expirationDate) : dayjs().add(30, 'day'),
            status: 'DRAFT',
            paymentStatus: 'UNPAID',
            includeAllItems: true,
            createEmptySection: true
          });
        } catch (error) {
          console.error('Erreur:', error);
          message.error('Impossible de charger les données du devis');
        } finally {
          setLoading(false);
        }
      };
      
      fetchDevis();
    }
  }, [isOpen, devisId, form]);
  
  useEffect(() => {
    // Écouter les changements sur includeAllItems
    const includeAllItems = form.getFieldValue('includeAllItems');
    if (includeAllItems) {
      form.setFieldsValue({ createEmptySection: false });
    }
  }, [form.getFieldValue('includeAllItems')]);
  
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // Vérifier que les données du devis sont disponibles
      if (!devisData) {
        throw new Error('Données du devis non disponibles');
      }
      
      console.log("Création de facture avec les données:", values);
      console.log("Données du devis:", devisData);
      
      // Préparer les données de la facture
      const invoiceData = {
        devisId,
        clientId: values.clientId,
        status: values.status,
        paymentStatus: values.paymentStatus,
        paymentMethod: values.paymentMethod,
        invoiceDate: values.invoiceDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        notes: values.notes,
        sections: values.includeAllItems ? devisData.sections.map((section: any) => ({
          name: section.name,
          subTotal: section.subTotal,
          items: section.services ? section.services.map((service: any) => ({
            name: service.name,
            description: service.description,
            quantity: service.quantity,
            unit: service.unit,
            unitPrice: service.price || service.unitPrice,
            tva: service.tva || 20,
            amount: service.quantity * (service.price || service.unitPrice),
            materials: service.materials ? service.materials.map((material: any) => ({
              name: material.name,
              quantity: material.quantity,
              price: material.price,
              unit: material.unit || 'unité',
              reference: material.reference,
              tva: material.tva || 20
            })) : []
          })) : []
        })) : values.createEmptySection ? [{
          name: "Section par défaut",
          subTotal: 0,
          items: []
        }] : []
      };
      
      console.log("Données de facture préparées:", invoiceData);
      
      // Créer la facture
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur API:', errorData);
        throw new Error('Erreur lors de la création de la facture');
      }
      
      const newInvoice = await response.json();
      message.success('Facture créée avec succès');
      
      // Fermer le modal et rediriger vers la nouvelle facture
      onClose();
      router.push(`/invoices/${newInvoice.id}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la création de la facture');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      title="Créer une facture à partir du devis"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {loading && !devisData ? (
        <div className="flex justify-center py-8">
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="clientId"
            label="Client"
            rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Statut de la facture"
            rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
          >
            <Select>
              {Object.entries(INVOICE_STATUSES).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="paymentStatus"
            label="Statut du paiement"
            rules={[{ required: true, message: 'Veuillez sélectionner un statut de paiement' }]}
          >
            <Select>
              {Object.entries(PAYMENT_STATUSES).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="paymentMethod"
            label="Mode de paiement"
            rules={[{ required: true, message: 'Veuillez sélectionner un mode de paiement' }]}
          >
            <Select>
              {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                <Select.Option key={key} value={value}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="invoiceDate"
            label="Date de facture"
            rules={[{ required: true, message: 'Veuillez sélectionner une date de facture' }]}
            initialValue={dayjs()}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
          
          <Form.Item
            name="dueDate"
            label="Date d'échéance"
            rules={[{ required: true, message: 'Veuillez sélectionner une date d\'échéance' }]}
          >
            <DatePicker format="DD/MM/YYYY" className="w-full" />
          </Form.Item>
          
          <Form.Item
            name="includeAllItems"
            label="Inclure tous les éléments du devis"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>Oui</Select.Option>
              <Select.Option value={false}>Non (créer une facture vide)</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="createEmptySection"
            label="Créer une section vide"
            valuePropName="checked"
            dependencies={['includeAllItems']}
          >
            <Select disabled={form.getFieldValue('includeAllItems')}>
              <Select.Option value={true}>Oui</Select.Option>
              <Select.Option value={false}>Non</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>
              Annuler
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Créer la facture
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}; 
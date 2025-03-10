'use client';

import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, DatePicker, Switch, Card, Typography, Divider } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface RetentionGuaranteeFormProps {
  totalHT: number;
  hasRetention: boolean;
  onHasRetentionChange: (hasRetention: boolean) => void;
  retentionData: any;
  onRetentionChange: (data: any) => void;
}

export default function RetentionGuaranteeForm({
  totalHT,
  hasRetention,
  onHasRetentionChange,
  retentionData,
  onRetentionChange
}: RetentionGuaranteeFormProps) {
  const [form] = Form.useForm();
  const [rate, setRate] = useState<number>(retentionData?.rate || 5);
  const [amount, setAmount] = useState<number>(retentionData?.amount || 0);
  const [releaseDate, setReleaseDate] = useState<dayjs.Dayjs | null>(
    retentionData?.releaseDate ? dayjs(retentionData.releaseDate) : dayjs().add(1, 'year')
  );

  // Initialiser les valeurs du formulaire lorsque retentionData change
  useEffect(() => {
    if (retentionData) {
      setRate(retentionData.rate || 5);
      // Le montant sera calculé automatiquement en fonction du taux
      setReleaseDate(retentionData.releaseDate ? dayjs(retentionData.releaseDate) : dayjs().add(1, 'year'));
      
      form.setFieldsValue({
        rate: retentionData.rate,
        notes: retentionData.notes || ''
      });
    }
  }, [retentionData, form]);

  // Calculer le montant de la retenue lorsque le taux ou le total HT change
  useEffect(() => {
    if (hasRetention) {
      const calculatedAmount = (totalHT * rate) / 100;
      const roundedAmount = parseFloat(calculatedAmount.toFixed(2));
      setAmount(roundedAmount);
      
      // Mettre à jour les données du formulaire
      form.setFieldsValue({ 
        amount: roundedAmount,
        releaseDate: releaseDate
      });
      
      // Mettre à jour les données parent
      onRetentionChange({
        id: retentionData?.id,
        rate,
        amount: roundedAmount,
        releaseDate: releaseDate?.format('YYYY-MM-DD'),
        notes: form.getFieldValue('notes')
      });
    }
  }, [totalHT, rate, hasRetention]);

  // Mettre à jour les données parent lorsque les champs changent
  const handleFieldChange = () => {
    if (hasRetention) {
      // Calculer le montant automatiquement
      const calculatedAmount = (totalHT * rate) / 100;
      const roundedAmount = parseFloat(calculatedAmount.toFixed(2));
      
      onRetentionChange({
        id: retentionData?.id,
        rate: form.getFieldValue('rate'),
        amount: roundedAmount,
        releaseDate: releaseDate?.format('YYYY-MM-DD'),
        notes: form.getFieldValue('notes')
      });
    }
  };

  // Gérer le changement de l'activation de la retenue
  const handleRetentionToggle = (checked: boolean) => {
    onHasRetentionChange(checked);
    
    if (checked) {
      // Initialiser les valeurs par défaut
      const defaultRate = 5;
      const calculatedAmount = (totalHT * defaultRate) / 100;
      const roundedAmount = parseFloat(calculatedAmount.toFixed(2));
      const defaultReleaseDate = dayjs().add(1, 'year');
      
      setRate(defaultRate);
      setAmount(roundedAmount);
      setReleaseDate(defaultReleaseDate);
      
      form.setFieldsValue({
        rate: defaultRate,
        amount: roundedAmount,
        releaseDate: defaultReleaseDate
      });
      
      onRetentionChange({
        rate: defaultRate,
        amount: roundedAmount,
        releaseDate: defaultReleaseDate.format('YYYY-MM-DD'),
        notes: ''
      });
    } else {
      onRetentionChange(null);
    }
  };

  return (
    <Card title="Retenue de garantie" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Switch
          checked={hasRetention}
          onChange={handleRetentionToggle}
          style={{ marginRight: 8 }}
        />
        <Text>Appliquer une retenue de garantie</Text>
      </div>
      
      {hasRetention && (
        <div className="retention-form-container">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="rate"
              label="Taux de retenue (%)"
              style={{ width: '30%' }}
              rules={[{ required: true, message: 'Veuillez saisir le taux de retenue' }]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                style={{ width: '100%' }}
                value={rate}
                onChange={(value) => {
                  setRate(value || 0);
                  form.setFieldsValue({ rate: value });
                  handleFieldChange();
                }}
              />
            </Form.Item>
            
            <Form.Item
              name="amount"
              label="Montant de la retenue (€)"
              style={{ width: '30%' }}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                value={amount}
                disabled={true} // Désactivé car calculé automatiquement
              />
            </Form.Item>
            
            <Form.Item
              name="releaseDate"
              label="Date de libération prévue"
              style={{ width: '40%' }}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                value={releaseDate}
                disabled={true} // Désactivé car défini automatiquement
              />
            </Form.Item>
          </div>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea 
              rows={2} 
              value={form.getFieldValue('notes')}
              onChange={(e) => {
                form.setFieldsValue({ notes: e.target.value });
                handleFieldChange();
              }}
            />
          </Form.Item>
          
          <Divider />
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Text strong>Montant HT avant retenue:</Text>
              <Text style={{ marginLeft: 8 }}>{totalHT.toFixed(2)} €</Text>
            </div>
            <div>
              <Text strong>Montant HT après retenue:</Text>
              <Text style={{ marginLeft: 8 }}>{(totalHT - amount).toFixed(2)} €</Text>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 
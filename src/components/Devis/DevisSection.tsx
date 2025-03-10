import { useState } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { Service, Material } from '@/types/Catalog';

interface DevisSectionProps {
  sectionName: string;
  catalogServices: Service[];
  onAddService: (serviceId: string) => void;
}

export default function DevisSection({ 
  sectionName, 
  catalogServices,
  onAddService 
}: DevisSectionProps) {
  const [searchValue, setSearchValue] = useState('');

  const serviceOptions = catalogServices.map(service => ({
    label: `${service.name} - ${service.price}€`,
    value: service.id
  }));

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{sectionName}</h3>
        <div className="text-right">
          <span className="mr-4">Matériaux : 0.00 €</span>
          <span>Sous total : 0.00 €</span>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th>Prestation</th>
            <th>Quantité</th>
            <th>Unité</th>
            <th>Prix unité</th>
            <th>TVA</th>
            <th>Montant</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2">
              <Select
                showSearch
                value={searchValue}
                placeholder="Rechercher une prestation..."
                defaultActiveFirstOption={false}
                showArrow={true}
                filterOption={(input, option) =>
                  (option?.label as string).toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => {
                  onAddService(value);
                  setSearchValue('');
                }}
                options={serviceOptions}
                style={{ width: '100%' }}
              />
            </td>
            <td className="py-2">
              <div className="flex items-center gap-2">
                <button>-</button>
                <Input type="number" value="0" className="w-20 text-center" />
                <button>+</button>
              </div>
            </td>
            <td className="py-2">
              <Select defaultValue="m²" style={{ width: '100%' }}>
                <Select.Option value="m²">m²</Select.Option>
                <Select.Option value="ml">ml</Select.Option>
                <Select.Option value="unité">unité</Select.Option>
              </Select>
            </td>
            <td className="py-2">
              <Input type="number" value="0" />
            </td>
            <td className="py-2">
              <Select defaultValue="20" style={{ width: '100%' }}>
                <Select.Option value="20">20%</Select.Option>
                <Select.Option value="10">10%</Select.Option>
                <Select.Option value="5.5">5.5%</Select.Option>
              </Select>
            </td>
            <td className="py-2 text-right">0.00 €</td>
            <td className="py-2"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 
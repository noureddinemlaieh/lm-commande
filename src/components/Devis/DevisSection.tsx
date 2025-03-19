import React, { useState } from 'react';
import { Form, Input, Select, Button, InputNumber, Checkbox } from 'antd';
import { DeleteOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { Service as CatalogService, Material as CatalogMaterial } from '@/types/Catalog';

interface Material extends CatalogMaterial {
  isExpanded?: boolean;
  toChoose?: boolean;
  tva?: number;
}

interface TemplateService extends Omit<CatalogService, 'materials'> {
  showInDevis: boolean;
  materialsTotal: number;
  subTotal: number;
  materials: Material[];
  isExpanded: boolean;
  tva?: number;
  quantity?: number;
}

interface DevisSectionProps {
  sectionId?: string;
  sectionName: string;
  catalogServices: CatalogService[];
  services: TemplateService[];
  onAddService: (serviceId: string) => void;
  onUpdateService: (serviceIndex: number, service: TemplateService) => void;
  onDeleteService: (serviceIndex: number) => void;
}

interface ServiceOption {
  label: string;
  value: string;
  service: CatalogService;
}

const DevisSection: React.FC<DevisSectionProps> = ({
  sectionName,
  catalogServices,
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const serviceOptions = catalogServices.map(service => ({
    label: `${service.name} - ${service.price}€`,
    value: service.id,
    service: service
  }));

  const toggleService = (serviceId: string) => {
    setExpandedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-4 px-4 font-medium">Prestation</th>
            <th className="text-center w-32 font-medium">Quantité</th>
            <th className="text-center w-32 font-medium">Unité</th>
            <th className="text-center w-32 font-medium">Prix unité</th>
            <th className="text-center w-32 font-medium">TVA</th>
            <th className="text-right w-40 pr-12 font-medium">Montant</th>
            <th className="w-12"></th>
          </tr>
        </thead>
        <tbody>
          <tr key="search-row">
            <td colSpan={7} className="py-4 px-4">
              <Select<string, ServiceOption>
                showSearch
                value={searchValue}
                placeholder="Rechercher une prestation..."
                defaultActiveFirstOption={false}
                filterOption={(input, option) =>
                  option?.label.toLowerCase().includes(input.toLowerCase()) ?? false
                }
                onChange={(value) => {
                  onAddService(value);
                  setSearchValue('');
                }}
                onSearch={(value) => {
                  setSearchValue(value);
                }}
                options={serviceOptions}
                style={{ width: '100%' }}
                notFoundContent={
                  catalogServices.length === 0 
                    ? "Sélectionnez un catalogue" 
                    : searchValue 
                      ? "Aucune prestation trouvée" 
                      : "Commencez à taper pour rechercher"
                }
              />
            </td>
          </tr>
          {services.map((service, serviceIndex) => (
            <React.Fragment key={`service-${service.id}`}>
              <tr className="group hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => toggleService(service.id!)}
                    >
                      {expandedServices.includes(service.id!) ? (
                        <DownOutlined className="text-xs" />
                      ) : (
                        <RightOutlined className="text-xs" />
                      )}
                    </button>
                    <span className="text-gray-900">{service.name}</span>
                  </div>
                </td>
                <td className="text-center">
                  <InputNumber
                    value={service.quantity}
                    min={1}
                    className="w-24"
                    controls={{
                      upIcon: <span className="text-xs">▲</span>,
                      downIcon: <span className="text-xs">▼</span>
                    }}
                    onChange={(value) => {
                      onUpdateService(serviceIndex, {
                        ...service,
                        quantity: value || 1
                      });
                    }}
                  />
                </td>
                <td className="text-center">
                  <Select
                    value={service.unit}
                    className="w-24"
                    onChange={(value) => {
                      onUpdateService(serviceIndex, { ...service, unit: value });
                    }}
                  >
                    <Select.Option value="m²">m²</Select.Option>
                    <Select.Option value="ml">ml</Select.Option>
                    <Select.Option value="u">u</Select.Option>
                  </Select>
                </td>
                <td className="text-center">
                  <InputNumber
                    value={service.price}
                    className="w-28"
                    formatter={value => `${value} €`}
                    parser={value => parseFloat(value?.replace(' €', '') || '0')}
                    onChange={(value) => {
                      onUpdateService(serviceIndex, {
                        ...service,
                        price: value || 0
                      });
                    }}
                  />
                </td>
                <td className="text-center">
                  <Select
                    value={service.tva || 20}
                    className="w-24"
                    onChange={(value) => {
                      onUpdateService(serviceIndex, { ...service, tva: value });
                    }}
                  >
                    <Select.Option value={5.5}>5.5%</Select.Option>
                    <Select.Option value={10}>10%</Select.Option>
                    <Select.Option value={20}>20%</Select.Option>
                  </Select>
                </td>
                <td className="text-right pr-12">
                  <span>{((service.price || 0) * (service.quantity || 1)).toFixed(2)} €</span>
                </td>
                <td>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteService(serviceIndex)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </td>
              </tr>
              {expandedServices.includes(service.id!) && (
                <tr key={`materials-${service.id}`}>
                  <td colSpan={7} className="px-8">
                    <div className="text-sm text-gray-600 mb-2">
                      Matériaux ({service.materials.length} matériaux inclus)
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="text-sm">
                          <th className="text-left py-2 font-medium w-[25%]">Nom</th>
                          <th className="text-left w-[15%] font-medium">Référence</th>
                          <th className="text-center w-[10%] font-medium">Quantité</th>
                          <th className="text-center w-[10%] font-medium">Unité</th>
                          <th className="text-right w-[10%] font-medium">Prix unitaire</th>
                          <th className="text-center w-[10%] font-medium">TVA</th>
                          <th className="text-center w-[10%] font-medium">Facturer</th>
                          <th className="text-right w-[10%] font-medium">Total</th>
                          <th className="w-[5%]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.materials.map((material, materialIndex) => (
                          <tr key={`${service.id}-material-${material.id}`} className="group">
                            <td className="py-2">
                              <span>{material.name}</span>
                              {material.toChoose && (
                                <span className="text-gray-500 ml-2">(prix indicatif)</span>
                              )}
                            </td>
                            <td className="text-left">
                              <span className="text-gray-600">{material.reference}</span>
                            </td>
                            <td className="text-center">
                              <InputNumber
                                value={material.quantity}
                                min={1}
                                className="w-20"
                                controls={{
                                  upIcon: <span className="text-xs">▲</span>,
                                  downIcon: <span className="text-xs">▼</span>
                                }}
                                onChange={(value) => {
                                  const newService = { ...service };
                                  newService.materials[materialIndex].quantity = value || 1;
                                  onUpdateService(serviceIndex, newService);
                                }}
                              />
                            </td>
                            <td className="text-center">
                              <Select
                                value={material.unit}
                                className="w-20"
                                onChange={(value) => {
                                  const newService = { ...service };
                                  newService.materials[materialIndex].unit = value;
                                  onUpdateService(serviceIndex, newService);
                                }}
                              >
                                <Select.Option value="m²">m²</Select.Option>
                                <Select.Option value="ml">ml</Select.Option>
                                <Select.Option value="u">u</Select.Option>
                              </Select>
                            </td>
                            <td className="text-right">
                              <InputNumber
                                value={material.price}
                                className="w-24"
                                formatter={value => `${value} €`}
                                parser={value => parseFloat(value?.replace(' €', '') || '0')}
                                onChange={(value) => {
                                  const newService = { ...service };
                                  newService.materials[materialIndex].price = value || 0;
                                  onUpdateService(serviceIndex, newService);
                                }}
                              />
                            </td>
                            <td className="text-center">
                              <Select
                                value={material.tva || 20}
                                className="w-20"
                                onChange={(value) => {
                                  const newService = { ...service };
                                  newService.materials[materialIndex].tva = value;
                                  onUpdateService(serviceIndex, newService);
                                }}
                              >
                                <Select.Option value={5.5}>5.5%</Select.Option>
                                <Select.Option value={10}>10%</Select.Option>
                                <Select.Option value={20}>20%</Select.Option>
                              </Select>
                            </td>
                            <td className="text-center">
                              <Checkbox
                                checked={material.toChoose}
                                onChange={(e) => {
                                  const newService = { ...service };
                                  newService.materials[materialIndex].toChoose = e.target.checked;
                                  onUpdateService(serviceIndex, newService);
                                }}
                              />
                            </td>
                            <td className="text-right pr-4">
                              {((material.price || 0) * (material.quantity || 1)).toFixed(2)} €
                            </td>
                            <td className="text-center">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  const newService = { ...service };
                                  newService.materials = newService.materials.filter((_, index) => index !== materialIndex);
                                  onUpdateService(serviceIndex, newService);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DevisSection; 
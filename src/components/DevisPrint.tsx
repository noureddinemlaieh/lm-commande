import React from 'react';
import { Section } from '@/types/Devis';

interface DevisPrintProps {
  devisNumber: string;
  sections: Section[];
  totals: {
    services: { totalHT: number; tvaDetails: Array<{ taux: number; tva: number }> };
    materials: { totalHT: number; tvaDetails: Array<{ taux: number; tva: number }> };
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
  };
  contact?: { name: string; address?: string };
}

export const DevisPrint: React.FC<DevisPrintProps> = ({ 
  devisNumber, 
  sections, 
  totals,
  contact 
}) => {
  return (
    <div className="p-8">
      {/* En-tête */}
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">DEVIS {devisNumber}</h1>
          <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
        </div>
        <div>
          <h2 className="font-bold">Client</h2>
          <p>{contact?.name}</p>
          <p>{contact?.address}</p>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <div key={section.id} className="mb-6">
          <h3 className="font-bold text-lg mb-2">{section.name}</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Désignation</th>
                <th className="p-2 text-right">Qté</th>
                <th className="p-2 text-right">PU HT</th>
                <th className="p-2 text-right">TVA</th>
                <th className="p-2 text-right">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {section.prestations.map((prestation) => (
                <tr key={prestation.id}>
                  <td className="p-2">{prestation.name}</td>
                  <td className="p-2 text-right">{prestation.quantity}</td>
                  <td className="p-2 text-right">{prestation.unitPrice.toFixed(2)} €</td>
                  <td className="p-2 text-right">{prestation.tva}%</td>
                  <td className="p-2 text-right">
                    {(prestation.quantity * prestation.unitPrice).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Totaux */}
      <div className="mt-8">
        <div className="flex justify-end">
          <table className="w-64">
            <tbody>
              <tr>
                <td className="p-2">Total HT</td>
                <td className="p-2 text-right">{totals.totalHT.toFixed(2)} €</td>
              </tr>
              <tr>
                <td className="p-2">Total TVA</td>
                <td className="p-2 text-right">{totals.totalTVA.toFixed(2)} €</td>
              </tr>
              <tr className="font-bold">
                <td className="p-2">Total TTC</td>
                <td className="p-2 text-right">{totals.totalTTC.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 
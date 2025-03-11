'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CatalogueItem, CatalogueService } from '../types/catalogue';
import { getCatalogues } from '../services/catalogueService';
import { message, App, Select, InputNumber } from 'antd';
import { DEVIS_STATUS } from '@/constants/devisStatus';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useRouter } from 'next/navigation';
import type { SelectProps } from 'antd';

interface DevisSection {
  id: number;
  name: string;
  materialsTotal: number;
  subTotal: number;
  services: DevisPrestation[];
}

interface DevisPrestation {
  id: string | number;
  name: string;
  reference?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tva: number;
  total: number;
  materials: Material[];
}

interface Catalogue {
  id: string;
  name: string;
  // Ajouter d'autres propriétés si nécessaire
}

interface Devis {
  id: string;
  clientInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    selectedCatalogue: string;
  };
  sections: DevisSection[];
  status: string;
  numero: string;
  createdAt: string;
  updatedAt: string;
}

interface DevisProps {
  initialData?: {
    id?: string;
    clientInfo?: {
      name?: string;
      address?: string;
      email?: string;
      phone?: string;
      selectedCatalogue?: string;
    };
    sections?: DevisSection[];
    status?: string;
    numero?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  onSave?: () => void;
}

interface Material {
  id: number | string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface Prestation {
  id: string;
  name: string;
  reference?: string;
  unit: string;
  sellingPrice?: number;
  price?: number;
  tva?: number;
  materials?: Material[];
}

interface Section {
  id: string;
  name: string;
  prestations: DevisPrestation[];
  materialsTotal: number;
  subTotal: number;
}

export default function Devis({ initialData = {} }: DevisProps) {
  console.log('Devis component - Initial Data:', initialData);

  const defaultDevis: Devis = {
    id: '',
    clientInfo: {
      name: '',
      address: '',
      email: '',
      phone: '',
      selectedCatalogue: ''
    },
    sections: [],
    status: DEVIS_STATUS.DRAFT,
    numero: '',
    createdAt: '',
    updatedAt: ''
  };

  const [devis, setDevis] = useState<Devis>(() => {
    console.log('Initializing devis state with:', initialData);
    return {
      ...defaultDevis,
      ...initialData,
      clientInfo: {
        ...defaultDevis.clientInfo,
        ...(initialData.clientInfo || {})
      }
    };
  });

  // Mise à jour du devis quand initialData change
  useEffect(() => {
    console.log('initialData changed:', initialData);
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('Updating devis with new initialData');
      setDevis(prevDevis => ({
        ...prevDevis,
        ...initialData,
        clientInfo: {
          ...prevDevis.clientInfo,
          ...(initialData.clientInfo || {})
        }
      }));
    }
  }, [initialData]);

  const [sections, setSections] = useState<DevisSection[]>(devis.sections);
  const [newSectionName, setNewSectionName] = useState('');
  const [isClientInfoOpen, setIsClientInfoOpen] = useState(true);
  const [isDevisOpen, setIsDevisOpen] = useState(true);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [isLoadingCatalogues, setIsLoadingCatalogues] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  const { message: appMessage } = App.useApp();
  const [searchValue, setSearchValue] = useState('');
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [prestationToDelete, setPrestationToDelete] = useState<{
    sectionId: number, 
    prestationId: string | number
  } | null>(null);
  const [expandedPrestations, setExpandedPrestations] = useState<Array<string | number>>([]);

  const fetchDevisList = useCallback(async () => {
    try {
      const response = await fetch('/api/devis');
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      const data = await response.json();
      setDevisList(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      appMessage.error('Erreur lors de la récupération des devis');
    }
  }, [appMessage]);

  useEffect(() => {
    fetchDevisList();
  }, [fetchDevisList, refreshKey]);

  const refreshDevisList = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        setIsLoadingCatalogues(true);
        setCatalogueError(null);
        const data = await getCatalogues();
        console.log('Catalogues loaded:', data);
        setCatalogues(data);
      } catch (error) {
        console.error('Erreur:', error);
        setCatalogueError('Impossible de charger les catalogues');
      } finally {
        setIsLoadingCatalogues(false);
      }
    };

    fetchCatalogues();
  }, []);

  const addSection = () => {
    if (!newSectionName) return;
    setSections([
      ...sections,
      {
        id: Date.now(),
        name: newSectionName,
        services: [],
        materialsTotal: 0,
        subTotal: 0
      }
    ]);
    setNewSectionName('');
  };

  const addPrestation = (sectionId: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: [...section.services, {
            id: Date.now().toString(),
            name: 'Nouvelle prestation',
            quantity: 1,
            unit: 'm²',
            unitPrice: 0,
            tva: 20,
            total: 0,
            materials: []
          }]
        };
      }
      return section;
    }));
  };

  const handleSave = async () => {
    try {
      const devisData = {
        clientInfo: {
          name: devis.clientInfo.name,
          address: devis.clientInfo.address,
          email: devis.clientInfo.email,
          phone: devis.clientInfo.phone,
          selectedCatalogue: devis.clientInfo.selectedCatalogue,
          status: devis.status
        },
        sections: sections,
        status: devis.status,
        numero: devis.numero
      };

      // Si c'est un nouveau devis (pas d'ID)
      if (!devis.id) {
        const response = await fetch('/api/devis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(devisData),
        });

        if (response.ok) {
          refreshDevisList();
          appMessage.success('Devis créé avec succès!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la création');
        }
      } else {
        // Si c'est une mise à jour
        const response = await fetch(`/api/devis/${devis.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(devisData),
        });

        if (response.ok) {
          refreshDevisList();
          appMessage.success('Devis mis à jour avec succès!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      appMessage.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde du devis');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case DEVIS_STATUS.DRAFT: return 'bg-gray-200';
      case DEVIS_STATUS.SENT: return 'bg-blue-200';
      case DEVIS_STATUS.ACCEPTED: return 'bg-green-200';
      case DEVIS_STATUS.REFUSED: return 'bg-red-200';
      case DEVIS_STATUS.CANCELED: return 'bg-yellow-200';
      default: return 'bg-gray-200';
    }
  };

  const updateStatus = (newStatus: string) => {
    setDevis({ ...devis, status: newStatus });
  };

  // Remplacer les imports d'icônes par ces SVG personnalisés
  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"></path>
    </svg>
  );

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  // Fonction pour vérifier les modifications
  const checkForChanges = useCallback(() => {
    return (
      JSON.stringify(sections) !== JSON.stringify(devis.sections) ||
      JSON.stringify(devis.clientInfo) !== JSON.stringify(devis.clientInfo) ||
      devis.status !== (devis.status || DEVIS_STATUS.DRAFT) ||
      devis.numero !== (devis.numero || '')
    );
  }, [sections, devis]);

  // Mettre à jour hasChanges lorsque les données changent
  useEffect(() => {
    setHasChanges(checkForChanges());
  }, [checkForChanges]);

  // Gestionnaire d'événement beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  // Gestionnaire pour le bouton Retour
  const handleBackButton = () => {
    if (hasChanges) {
      setShowConfirmation(true);
    } else {
      window.history.back();
    }
  };

  const fetchPrestations = async (catalogueId: string) => {
    try {
      const response = await fetch(`/api/prestations/search?catalogueId=${catalogueId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des prestations');
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Modifiez l'effet qui gère le changement de catalogue
  useEffect(() => {
    if (devis.clientInfo.selectedCatalogue) {
      fetchPrestations(devis.clientInfo.selectedCatalogue);
    }
  }, [devis.clientInfo.selectedCatalogue]);

  // Modifiez la fonction handlePrestationSelect
  const handlePrestationSelect = (sectionId: number, prestationId: string) => {
    const selectedPrestation = prestations.find(p => p.id === prestationId);
    if (!selectedPrestation) return;

    setSections(prevSections => prevSections.map(section => {
      if (section.id === sectionId) {
        const updatedPrestations = section.services.map(p => {
          if (p.name === 'Nouvelle prestation' || p.name === '') {
            const newPrestation: DevisPrestation = {
              ...p,
              name: selectedPrestation.name,
              reference: selectedPrestation.reference || '',
              quantity: 1,
              unit: selectedPrestation.unit || 'm²',
              unitPrice: selectedPrestation.sellingPrice || selectedPrestation.price || 0,
              tva: selectedPrestation.tva || 20,
              total: selectedPrestation.sellingPrice || selectedPrestation.price || 0,
              materials: selectedPrestation.materials?.map(m => ({
                id: typeof m.id === 'string' ? parseInt(m.id) : m.id,
                name: m.name,
                quantity: m.quantity,
                price: m.price,
                unit: m.unit
              })) || []
            };
            return newPrestation;
          }
          return p;
        });

        return {
          ...section,
          services: updatedPrestations,
          materialsTotal: calculateMaterialsTotal(updatedPrestations),
          subTotal: calculateSubTotal(updatedPrestations)
        };
      }
      return section;
    }));
  };

  // Ajoutez ces fonctions utilitaires
  const calculateMaterialsTotal = (prestations: DevisPrestation[]) => {
    return prestations.reduce((total, prestation) => {
      const materialsSum = prestation.materials?.reduce((sum, material) => 
        sum + (material.price * material.quantity), 0) || 0;
      return total + materialsSum;
    }, 0);
  };

  const calculateSubTotal = (prestations: DevisPrestation[]) => {
    return prestations.reduce((total, prestation) => 
      total + (prestation.unitPrice * prestation.quantity), 0);
  };

  // Modifiez la fonction handleSearch pour inclure plus d'informations
  const handleSearch = async (value: string) => {
    setSearchValue(value);
    try {
      const catalogueId = devis.clientInfo.selectedCatalogue;
      if (!catalogueId) return;

      const response = await fetch(
        `/api/prestations/search?q=${encodeURIComponent(value)}&catalogueId=${catalogueId}`
      );
      if (!response.ok) throw new Error('Erreur de recherche');
      const data = await response.json();
      setPrestations(data);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setPrestations([]);
    }
  };

  const prestationOptions: SelectProps['options'] = prestations.map(p => ({
    label: p.name,
    value: p.id
  }));

  // Modifier la fonction de suppression
  const handleDeletePrestation = (sectionId: number, prestationId: string | number) => {
    setPrestationToDelete({ sectionId, prestationId });
    setShowDeleteConfirmation(true);
  };

  // Ajouter la fonction de confirmation de suppression
  const confirmDeletePrestation = () => {
    if (prestationToDelete) {
      const { sectionId, prestationId } = prestationToDelete;
      setSections(sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            services: section.services.filter(p => p.id !== prestationId)
          };
        }
        return section;
      }));
      setHasChanges(true);
    }
    setShowDeleteConfirmation(false);
    setPrestationToDelete(null);
  };

  // Modifier la fonction togglePrestation
  const togglePrestation = (prestationId: string | number) => {
    setExpandedPrestations(prev => 
      prev.includes(prestationId) 
        ? prev.filter(id => id !== prestationId)
        : [...prev, prestationId]
    );
  };

  const handleQuantityChange = (sectionId: number, prestationId: string | number, value: number | null) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: section.services.map(prestation => {
            if (prestation.id === prestationId) {
              const newQuantity = value || 0;
              return {
                ...prestation,
                quantity: newQuantity,
                total: prestation.unitPrice * newQuantity
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Ajout des fonctions de gestion des changements
  const handleUnitChange = (sectionId: number, prestationId: string | number, value: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: section.services.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                unit: value
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handlePriceChange = (sectionId: number, prestationId: string | number, value: number | null) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: section.services.map(prestation => {
            if (prestation.id === prestationId) {
              const newPrice = value || 0;
              return {
                ...prestation,
                unitPrice: newPrice,
                total: newPrice * prestation.quantity
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handleTvaChange = (sectionId: number, prestationId: string | number, value: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: section.services.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                tva: value
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Ajout de la fonction handleDeleteMaterial manquante
  const handleDeleteMaterial = (sectionId: number, prestationId: string | number, materialId: string | number) => {
    setSections(prevSections => prevSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          services: section.services.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.filter(m => m.id !== materialId)
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec titre, statut et boutons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackButton}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-2xl font-bold">
            Devis {devis.numero && `#${devis.numero}`}
          </h1>
          {/* Statut du devis */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(devis.status)}`}>
            {devis.status}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Boutons pour changer le statut */}
          <button 
            onClick={() => updateStatus(DEVIS_STATUS.SENT)}
            className="w-8 h-8 flex items-center justify-center border border-blue-200 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
            title="Envoyer"
          >
            <SendIcon />
          </button>
          <button 
            onClick={() => updateStatus(DEVIS_STATUS.ACCEPTED)}
            className="w-8 h-8 flex items-center justify-center border border-green-200 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
            title="Accepter"
          >
            <CheckIcon />
          </button>
          <button 
            onClick={() => updateStatus(DEVIS_STATUS.REFUSED)}
            className="w-8 h-8 flex items-center justify-center border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Refuser"
          >
            <CloseIcon />
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-600 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Conteneur Informations Client */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsClientInfoOpen(!isClientInfoOpen)}
        >
          <h2 className="text-xl font-semibold">Informations Client</h2>
          <svg
            className={`w-6 h-6 transform transition-transform ${
              isClientInfoOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        
        {isClientInfoOpen && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={devis.clientInfo.name}
                onChange={(e) => setDevis({ ...devis, clientInfo: { ...devis.clientInfo, name: e.target.value } })}
                className="w-full p-2 border rounded"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={devis.clientInfo.address}
                onChange={(e) => setDevis({ ...devis, clientInfo: { ...devis.clientInfo, address: e.target.value } })}
                className="w-full p-2 border rounded"
                placeholder="Adresse du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={devis.clientInfo.email}
                onChange={(e) => setDevis({ ...devis, clientInfo: { ...devis.clientInfo, email: e.target.value } })}
                className="w-full p-2 border rounded"
                placeholder="Email du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                value={devis.clientInfo.phone}
                onChange={(e) => setDevis({ ...devis, clientInfo: { ...devis.clientInfo, phone: e.target.value } })}
                className="w-full p-2 border rounded"
                placeholder="Téléphone du client"
              />
            </div>
           
          </div>
        )}
      </div>

      {/* Nouveau Bloc Devis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsDevisOpen(!isDevisOpen)}
        >
          <h2 className="text-xl font-semibold">Devis</h2>
          <svg
            className={`w-6 h-6 transform transition-transform ${
              isDevisOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isDevisOpen && (
          <div className="mt-4 space-y-6">
            {/* Conteneur Sections Devis */}
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Nom de la section (ex: Salle de bain)"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={addSection}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Ajouter Section
                </button>
              </div>

              {sections.map((section) => (
                <div key={section.id} className="mb-4 border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-4 flex justify-between items-center">
                    <h3 className="font-semibold">{section.name}</h3>
                    <div className="space-x-4">
                      <span>Total matériaux : {section.materialsTotal.toFixed(2)}€</span>
                      <span>Sous-total : {section.subTotal.toFixed(2)}€</span>
                    </div>
                  </div>

                  <table className="w-full">
                    <tr>
                      <th>Prestation</th>
                      <th>Quantité</th>
                      <th>Unité</th>
                      <th>Prix unité</th>
                      <th>TVA</th>
                      <th>Montant</th>
                      <th></th>
                    </tr>
                    {section.services.map((prestation) => (
                      <>
                        <tr key={prestation.id}>
                          <td>
                            <div className="flex items-center">
                              <button
                                onClick={() => togglePrestation(prestation.id)}
                                className="mr-2"
                              >
                                {expandedPrestations.includes(prestation.id) ? '▼' : '▶'}
                              </button>
                              {prestation.name}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center justify-center">
                              <button 
                                className="px-2 border rounded-l"
                                onClick={() => handleQuantityChange(section.id, prestation.id, Math.max(1, prestation.quantity - 1))}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={prestation.quantity}
                                onChange={(e) => handleQuantityChange(section.id, prestation.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center border-y"
                                min="1"
                              />
                              <button 
                                className="px-2 border rounded-r"
                                onClick={() => handleQuantityChange(section.id, prestation.id, prestation.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <Select
                              value={prestation.unit}
                              onChange={(value) => handleUnitChange(section.id, prestation.id, value)}
                              bordered={false}
                              className="w-full"
                            >
                              <Select.Option value="m²">m²</Select.Option>
                              <Select.Option value="ml">ml</Select.Option>
                              <Select.Option value="u">u</Select.Option>
                            </Select>
                          </td>
                          <td>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={prestation.unitPrice}
                                onChange={(e) => handlePriceChange(section.id, prestation.id, parseFloat(e.target.value) || 0)}
                                className="w-full border-none"
                              />
                              <span>€</span>
                            </div>
                          </td>
                          <td>
                            <Select
                              value={prestation.tva}
                              onChange={(value) => handleTvaChange(section.id, prestation.id, value)}
                              bordered={false}
                              className="w-full"
                            >
                              <Select.Option value={20}>20%</Select.Option>
                              <Select.Option value={10}>10%</Select.Option>
                              <Select.Option value={5.5}>5.5%</Select.Option>
                            </Select>
                          </td>
                          <td className="text-right">{((prestation.unitPrice || 0) * (prestation.quantity || 0)).toFixed(2)} €</td>
                          <td>
                            <button onClick={() => handleDeletePrestation(section.id, prestation.id)}>
                              🗑️
                            </button>
                          </td>
                        </tr>
                        {expandedPrestations.includes(prestation.id) && (
                          <tr>
                            <td colSpan={7}>
                              <div className="pl-8">
                                <div className="font-medium mb-2">Matériaux :</div>
                                <table className="w-full">
                                  <tr>
                                    <th>Nom</th>
                                    <th>Quantité</th>
                                    <th>Unité</th>
                                    <th>Prix unitaire</th>
                                    <th>Total</th>
                                    <th></th>
                                  </tr>
                                  {prestation.materials?.map((material) => (
                                    <tr key={material.id}>
                                      <td>{material.name}</td>
                                      <td className="text-center">{material.quantity}</td>
                                      <td className="text-center">{material.unit}</td>
                                      <td className="text-right">{material.price} €</td>
                                      <td className="text-right">{(material.quantity * material.price).toFixed(2)} €</td>
                                      <td className="text-center">
                                        <button onClick={() => handleDeleteMaterial(section.id, prestation.id, material.id)}>
                                          🗑️
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                  <tr>
                                    <td colSpan={6}>
                                      <button className="text-blue-500">
                                        +
                                      </button>
                                    </td>
                                  </tr>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirmation"
        message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?"
        onConfirm={() => {
          setShowConfirmation(false);
          window.history.back();
        }}
        onCancel={() => setShowConfirmation(false)}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Supprimer la prestation"
        message="Êtes-vous sûr de vouloir supprimer cette prestation ?"
        onConfirm={confirmDeletePrestation}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setPrestationToDelete(null);
        }}
      />
    </div>
  );
} 
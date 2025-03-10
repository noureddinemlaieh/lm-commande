'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { formatPrice } from '@/lib/utils';
import { Spin, Button, Input, Select } from 'antd';
import './devis-card.css';
import { getProjectTypeLabel } from '@/constants/projectTypes';
import Image from 'next/image';
import { PlusOutlined, SearchOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import React from 'react';
import { useStableCallback } from '@/utils/reactOptimizations';

interface Devis {
  id: string;
  numero: string;
  clientName: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  client?: {
    name: string;
    prescriberId?: string;
    prescriber?: {
      id: string;
      nom: string;
      logo?: string;
    };
  };
  sections: {
    services: {
      price: number;
      quantity: number;
      materials: {
        price: number;
        quantity: number;
      }[];
    }[];
  }[];
  reference?: string;
  clientId?: string;
  projectType?: string;
}

const STATUS_TRANSLATIONS = {
  'DRAFT': 'Brouillon',
  'SENT': 'Envoyé',
  'ACCEPTED': 'Accepté',
  'REJECTED': 'Refusé'
};

export default function DevisListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    totalAmount: 0,
    averageAmount: 0,
    thisMonth: 0,
    thisMonthAmount: 0
  });

  // Calculer le total d'un devis
  const calculateDevisTotal = useCallback((devis: Devis) => {
    return devis.sections.reduce((acc, section) => {
      const sectionTotal = section.services.reduce((serviceAcc, service) => {
        const serviceTotal = service.price * service.quantity;
        const materialsTotal = service.materials.reduce((matAcc, material) => 
          matAcc + (material.price * material.quantity), 0);
        return serviceAcc + serviceTotal + materialsTotal;
      }, 0);
      return acc + sectionTotal;
    }, 0);
  }, []);

  // Calculer les statistiques
  const calculateStats = useCallback((devis: Devis[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let totalAmount = 0;
    let thisMonthAmount = 0;
    let draftCount = 0;
    let sentCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;
    let thisMonthCount = 0;

    devis.forEach(item => {
      const total = calculateDevisTotal(item);
      totalAmount += total;
      
      // Compter par statut
      if (item.status === 'DRAFT') draftCount++;
      else if (item.status === 'SENT') sentCount++;
      else if (item.status === 'ACCEPTED') acceptedCount++;
      else if (item.status === 'REJECTED') rejectedCount++;
      
      // Compter pour ce mois
      const devisDate = new Date(item.createdAt);
      if (devisDate.getMonth() === thisMonth && devisDate.getFullYear() === thisYear) {
        thisMonthCount++;
        thisMonthAmount += total;
      }
    });

    setStats({
      total: devis.length,
      draft: draftCount,
      sent: sentCount,
      accepted: acceptedCount,
      rejected: rejectedCount,
      totalAmount,
      averageAmount: devis.length > 0 ? totalAmount / devis.length : 0,
      thisMonth: thisMonthCount,
      thisMonthAmount
    });
  }, [calculateDevisTotal]);

  // Fonction pour rafraîchir la liste
  const refreshDevisList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Chargement des devis...");
      const response = await fetch('/api/devis?includeClient=true&includePrescriber=true');
      if (!response.ok) {
        throw new Error(`Erreur lors du chargement des devis: ${response.status} ${response.statusText}`);
      }
      const responseData = await response.json();
      console.log("Données reçues:", responseData);
      const devisData = responseData.data || [];
      setDevisList(devisData);
      calculateStats(devisData);
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // Charger les données au montage du composant
  useEffect(() => {
    refreshDevisList();
  }, [refreshDevisList]);

  // Rafraîchir la liste quand on revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshDevisList();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshDevisList]);

  // Filtrer et trier les devis
  const filteredAndSortedDevis = useCallback(() => {
    let filtered = [...devisList];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(devis => 
        (devis.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (devis.reference || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter) {
      filtered = filtered.filter(devis => devis.status === statusFilter);
    }
    
    // Trier les résultats
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'amount') {
        const amountA = calculateDevisTotal(a);
        const amountB = calculateDevisTotal(b);
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      } else if (sortBy === 'client') {
        const clientA = a.client?.name || '';
        const clientB = b.client?.name || '';
        return sortOrder === 'asc' 
          ? clientA.localeCompare(clientB)
          : clientB.localeCompare(clientA);
      }
      return 0;
    });
    
    return filtered;
  }, [devisList, searchTerm, statusFilter, sortBy, sortOrder, calculateDevisTotal]);

  // Inverser l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (loading && devisList.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Chargement des devis..." />
      </div>
    );
  }

  const filteredDevis = filteredAndSortedDevis();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Devis</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => router.push('/devis/new')}
        >
          Nouveau Devis
        </Button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Erreur lors du chargement des devis</p>
              <p className="text-sm">{error}</p>
              <button 
                className="text-red-700 hover:text-red-900 text-sm font-medium mt-2"
                onClick={refreshDevisList}
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Section des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm text-gray-500 mb-1">Total des devis</div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{stats.thisMonth}</span> ce mois-ci
            </div>
          </div>
          <div className="mt-2 flex space-x-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(stats.accepted / stats.total) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{Math.round((stats.accepted / stats.total) * 100) || 0}% acceptés</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm text-gray-500 mb-1">Montant total</div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{formatPrice(stats.totalAmount)}</div>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{formatPrice(stats.thisMonthAmount)}</span> ce mois-ci
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Moyenne: <span className="font-medium">{formatPrice(stats.averageAmount)}</span> par devis
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm text-gray-500 mb-1">Statuts</div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div 
              className="status-button bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? null : 'DRAFT')}
            >
              <div className="text-xs text-gray-500">Brouillons</div>
              <div className="font-bold">{stats.draft}</div>
            </div>
            <div 
              className="status-button bg-blue-50 hover:bg-blue-100 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'SENT' ? null : 'SENT')}
            >
              <div className="text-xs text-blue-500">Envoyés</div>
              <div className="font-bold text-blue-700">{stats.sent}</div>
            </div>
            <div 
              className="status-button bg-green-50 hover:bg-green-100 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? null : 'ACCEPTED')}
            >
              <div className="text-xs text-green-500">Acceptés</div>
              <div className="font-bold text-green-700">{stats.accepted}</div>
            </div>
            <div 
              className="status-button bg-red-50 hover:bg-red-100 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? null : 'REJECTED')}
            >
              <div className="text-xs text-red-500">Refusés</div>
              <div className="font-bold text-red-700">{stats.rejected}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm text-gray-500 mb-1">Filtres et tri</div>
          <div className="mt-2">
            <input
              type="text"
              placeholder="Rechercher un client ou une référence..."
              className="w-full p-2 border rounded mb-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-2">
              <select 
                className="flex-1 p-2 border rounded text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'client')}
              >
                <option value="date">Trier par date</option>
                <option value="amount">Trier par montant</option>
                <option value="client">Trier par client</option>
              </select>
              <button 
                className="p-2 border rounded bg-gray-100 hover:bg-gray-200"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage des filtres actifs */}
      {(searchTerm || statusFilter) && (
        <div className="flex items-center mb-4 text-sm">
          <span className="mr-2">Filtres actifs:</span>
          {searchTerm && (
            <span className="filter-badge">
              Recherche: {searchTerm}
              <button 
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            </span>
          )}
          {statusFilter && (
            <span className="filter-badge">
              Statut: {STATUS_TRANSLATIONS[statusFilter as keyof typeof STATUS_TRANSLATIONS]}
              <button 
                onClick={() => setStatusFilter(null)}
              >
                ×
              </button>
            </span>
          )}
          {(searchTerm || statusFilter) && (
            <button 
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(null);
              }}
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}
      
      {/* Liste des devis */}
      {loading && filteredDevis.length > 0 ? (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <Spin size="large" tip="Rafraîchissement..." />
          </div>
          <div className="opacity-50">
            <div className="devis-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevis.map(devis => (
                <Link 
                  href={`/devis/${devis.id}/edit`}
                  key={devis.id} 
                  className="devis-card block relative flex bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow no-underline devis-card-animate"
                >
                  <div 
                    className={`status-indicator ${
                      devis.status === 'DRAFT' ? 'status-draft' :
                      devis.status === 'SENT' ? 'status-sent' :
                      devis.status === 'ACCEPTED' ? 'status-accepted' :
                      devis.status === 'REJECTED' ? 'status-rejected' :
                      ''
                    }`}
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between text-black">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {devis.client?.prescriber?.logo && (
                          <div className="mr-3 flex-shrink-0">
                            <Image 
                              src={devis.client.prescriber.logo} 
                              alt={`Logo ${devis.client.prescriber.nom}`}
                              width={48}
                              height={48}
                              className="object-contain rounded"
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-500">Client</div>
                          <h3 className="text-lg font-semibold" >
                            {devis.client?.name || 'Non défini'}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="font-medium">
                          <div className="text-sm text-gray-500">Devis n°</div>
                          <div>
                            {devis.reference || `DEVIS-${devis.id.substring(0, 8)}` || 'Sans numéro'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Statut</div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              devis.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                              devis.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                              devis.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                              devis.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {STATUS_TRANSLATIONS[devis.status as keyof typeof STATUS_TRANSLATIONS] || devis.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="text-sm">
                            {format(new Date(devis.createdAt), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Montant</div>
                          <div className="font-bold">{formatPrice(calculateDevisTotal(devis))}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : filteredDevis.length > 0 ? (
        <div className="devis-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevis.map(devis => (
            <Link 
              href={`/devis/${devis.id}/edit`}
              key={devis.id} 
              className="devis-card block relative flex bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow no-underline devis-card-animate"
            >
              <div 
                className={`status-indicator ${
                  devis.status === 'DRAFT' ? 'status-draft' :
                  devis.status === 'SENT' ? 'status-sent' :
                  devis.status === 'ACCEPTED' ? 'status-accepted' :
                  devis.status === 'REJECTED' ? 'status-rejected' :
                  ''
                }`}
              />
              <div className="flex-1 p-4 flex flex-col justify-between text-black">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    {devis.client?.prescriber?.logo && (
                      <div className="mr-3 flex-shrink-0">
                        <Image 
                          src={devis.client.prescriber.logo} 
                          alt={`Logo ${devis.client.prescriber.nom}`}
                          width={48}
                          height={48}
                          className="object-contain rounded"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Client</div>
                      <h3 className="text-lg font-semibold" >
                        {devis.client?.name || 'Non défini'}
                      </h3>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="font-medium">
                      <div className="text-sm text-gray-500">Devis n°</div>
                      <div>
                        {devis.reference || `DEVIS-${devis.id.substring(0, 8)}` || 'Sans numéro'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Statut</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          devis.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                          devis.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                          devis.status === 'ACCEPTED' ? 'bg-green-100 text-green-600' :
                          devis.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {STATUS_TRANSLATIONS[devis.status as keyof typeof STATUS_TRANSLATIONS] || devis.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="text-sm">
                        {format(new Date(devis.createdAt), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Montant</div>
                      <div className="font-bold">{formatPrice(calculateDevisTotal(devis))}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun devis trouvé</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter 
              ? "Aucun devis ne correspond à vos critères de recherche." 
              : "Vous n'avez pas encore créé de devis."}
          </p>
          {(searchTerm || statusFilter) && (
            <button 
              className="mt-4 text-blue-600 hover:text-blue-800"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(null);
              }}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
} 
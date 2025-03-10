'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Tag, Spin, message, Dropdown, Menu, Select } from 'antd';
import { PlusOutlined, MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PrinterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Invoice, INVOICE_STATUSES, PAYMENT_STATUSES } from '@/types/Invoice';
import { format, isAfter, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import './invoice-card.css';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'dueDate' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    unpaid: 0,
    partiallyPaid: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    thisMonth: 0,
    thisMonthAmount: 0,
    overdueCount: 0,
    averagePaymentDelay: 0,
    nextDueDate: null as Date | null,
    nextDueAmount: 0,
    oldestUnpaidDate: null as Date | null,
    oldestUnpaidAmount: 0
  });
  
  const router = useRouter();

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Erreur lors du chargement des factures');
      const data = await response.json();
      setInvoices(data);
      calculateStats(data);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Impossible de charger les factures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const calculateStats = (invoiceData: Invoice[]) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let thisMonthAmount = 0;
    let draftCount = 0;
    let sentCount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let unpaidCount = 0;
    let partiallyPaidCount = 0;
    let thisMonthCount = 0;
    
    // Pour le délai moyen de paiement
    let totalPaymentDelay = 0;
    let paidInvoicesWithDates = 0;
    
    // Pour les prochaines échéances
    let nextDueDate: Date | null = null;
    let nextDueAmount = 0;
    
    // Pour les factures impayées les plus anciennes
    let oldestUnpaidDate: Date | null = null;
    let oldestUnpaidAmount = 0;

    invoiceData.forEach(invoice => {
      totalAmount += invoice.totalTTC;
      
      // Compter par statut
      if (invoice.status === 'DRAFT') draftCount++;
      else if (invoice.status === 'SENT') sentCount++;
      else if (invoice.status === 'PAID') paidCount++;
      else if (invoice.status === 'OVERDUE') overdueCount++;
      
      // Compter par statut de paiement
      if (invoice.paymentStatus === 'UNPAID') {
        unpaidCount++;
        unpaidAmount += invoice.totalTTC;
        
        // Vérifier si c'est la facture impayée la plus ancienne
        if (invoice.createdAt) {
          const createdDate = new Date(invoice.createdAt);
          if (!oldestUnpaidDate || createdDate < oldestUnpaidDate) {
            oldestUnpaidDate = createdDate;
            oldestUnpaidAmount = invoice.totalTTC;
          }
        }
      } else if (invoice.paymentStatus === 'PARTIALLY_PAID') {
        partiallyPaidCount++;
        // On estime que 50% est payé pour les partiellement payées
        paidAmount += invoice.totalTTC * 0.5;
        unpaidAmount += invoice.totalTTC * 0.5;
      } else if (invoice.paymentStatus === 'PAID') {
        paidAmount += invoice.totalTTC;
        
        // Calculer le délai de paiement si les dates sont disponibles
        if (invoice.createdAt && invoice.paymentDate) {
          const createdDate = new Date(invoice.createdAt);
          const paymentDate = new Date(invoice.paymentDate);
          const delayInDays = Math.floor((paymentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (delayInDays >= 0) {
            totalPaymentDelay += delayInDays;
            paidInvoicesWithDates++;
          }
        }
      }
      
      // Vérifier si la facture est en retard
      if (invoice.dueDate && isAfter(now, parseISO(invoice.dueDate)) && invoice.paymentStatus !== 'PAID') {
        overdueCount++;
      }
      
      // Trouver la prochaine échéance
      if (invoice.dueDate && invoice.paymentStatus !== 'PAID') {
        const dueDate = new Date(invoice.dueDate);
        if (isAfter(dueDate, now)) {
          if (!nextDueDate || dueDate < nextDueDate) {
            nextDueDate = dueDate;
            nextDueAmount = invoice.totalTTC;
          }
        }
      }
      
      // Compter pour ce mois
      const invoiceDate = new Date(invoice.createdAt);
      if (invoiceDate.getMonth() === thisMonth && invoiceDate.getFullYear() === thisYear) {
        thisMonthCount++;
        thisMonthAmount += invoice.totalTTC;
      }
    });

    setStats({
      total: invoiceData.length,
      draft: draftCount,
      sent: sentCount,
      paid: paidCount,
      overdue: overdueCount,
      unpaid: unpaidCount,
      partiallyPaid: partiallyPaidCount,
      totalAmount,
      paidAmount,
      unpaidAmount,
      thisMonth: thisMonthCount,
      thisMonthAmount,
      overdueCount,
      averagePaymentDelay: paidInvoicesWithDates > 0 ? Math.round(totalPaymentDelay / paidInvoicesWithDates) : 0,
      nextDueDate,
      nextDueAmount,
      oldestUnpaidDate,
      oldestUnpaidAmount
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      
      message.success('Facture supprimée avec succès');
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la suppression de la facture');
    }
  };

  const handlePrint = (id: string) => {
    // Ouvrir la page de la facture dans un nouvel onglet pour l'impression
    window.open(`/invoices/${id}?print=true`, '_blank');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(id);
      
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      
      const updatedInvoice = await response.json();
      
      // Mettre à jour la liste des factures
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === id ? { ...invoice, status: newStatus } : invoice
      );
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
      
      message.success(`Statut de la facture mis à jour: ${INVOICE_STATUSES[newStatus as keyof typeof INVOICE_STATUSES]?.label || newStatus}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la mise à jour du statut de la facture');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handlePaymentStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(id);
      
      const response = await fetch(`/api/invoices/${id}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut de paiement');
      
      const updatedInvoice = await response.json();
      
      // Mettre à jour la liste des factures
      const updatedInvoices = invoices.map(invoice => 
        invoice.id === id ? { ...invoice, paymentStatus: newStatus } : invoice
      );
      setInvoices(updatedInvoices);
      calculateStats(updatedInvoices);
      
      message.success(`Statut de paiement mis à jour: ${PAYMENT_STATUSES[newStatus as keyof typeof PAYMENT_STATUSES]?.label || newStatus}`);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors de la mise à jour du statut de paiement');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filtrer et trier les factures
  const filteredAndSortedInvoices = () => {
    let filtered = [...invoices];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        (invoice.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.reference || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter) {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    // Filtrer par statut de paiement
    if (paymentStatusFilter) {
      filtered = filtered.filter(invoice => invoice.paymentStatus === paymentStatusFilter);
    }
    
    // Trier les résultats
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.totalTTC - b.totalTTC : b.totalTTC - a.totalTTC;
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
  };

  // Inverser l'ordre de tri
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Formater le prix
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Vérifier si une facture est en retard
  const isInvoiceOverdue = (invoice: Invoice) => {
    if (!invoice.dueDate) return false;
    return isAfter(new Date(), parseISO(invoice.dueDate)) && invoice.paymentStatus !== 'PAID';
  };

  const filteredInvoices = filteredAndSortedInvoices();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Chargement des factures..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* En-tête et bouton de création */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Factures</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => router.push('/invoices/new')}
        >
          Nouvelle Facture
        </Button>
      </div>

      {/* Section des statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm text-gray-500 mb-1">Total des factures</div>
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
                style={{ width: `${(stats.paid / stats.total) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{Math.round((stats.paid / stats.total) * 100) || 0}% payées</span>
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
          <div className="mt-2 flex space-x-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(stats.paidAmount / stats.totalAmount) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{Math.round((stats.paidAmount / stats.totalAmount) * 100) || 0}% encaissé</span>
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
              <div className="text-xs text-blue-500">Envoyées</div>
              <div className="font-bold text-blue-700">{stats.sent}</div>
            </div>
            <div 
              className="status-button bg-green-50 hover:bg-green-100 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'PAID' ? null : 'PAID')}
            >
              <div className="text-xs text-green-500">Payées</div>
              <div className="font-bold text-green-700">{stats.paid}</div>
            </div>
            <div 
              className="status-button bg-red-50 hover:bg-red-100 transition-colors"
              onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? null : 'OVERDUE')}
            >
              <div className="text-xs text-red-500">En retard</div>
              <div className="font-bold text-red-700">{stats.overdue}</div>
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
                onChange={(e) => setSortBy(e.target.value as 'date' | 'dueDate' | 'amount' | 'client')}
              >
                <option value="date">Trier par date</option>
                <option value="dueDate">Trier par échéance</option>
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

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Statistiques de paiement */}
        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm font-medium mb-3">Statut des paiements</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-xs text-red-500">Non payées</div>
              <div className="font-bold text-red-700">{stats.unpaid}</div>
              <div className="text-xs text-red-500 mt-1">{formatPrice(stats.unpaidAmount)}</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="text-xs text-orange-500">Partiellement</div>
              <div className="font-bold text-orange-700">{stats.partiallyPaid}</div>
              <div className="text-xs text-orange-500 mt-1">{formatPrice(stats.unpaidAmount * 0.5)}</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-xs text-green-500">Payées</div>
              <div className="font-bold text-green-700">{stats.paid}</div>
              <div className="text-xs text-green-500 mt-1">{formatPrice(stats.paidAmount)}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Répartition des paiements</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div 
                className="bg-red-500" 
                style={{ width: `${(stats.unpaidAmount / stats.totalAmount) * 100}%` }}
              ></div>
              <div 
                className="bg-orange-400" 
                style={{ width: `${(stats.unpaidAmount * 0.5 / stats.totalAmount) * 100}%` }}
              ></div>
              <div 
                className="bg-green-500" 
                style={{ width: `${(stats.paidAmount / stats.totalAmount) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Statistiques de délai de paiement */}
        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm font-medium mb-3">Délais de paiement</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Délai moyen</div>
              <div className="text-xl font-bold">
                {stats.averagePaymentDelay} <span className="text-sm font-normal">jours</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Factures en retard</div>
              <div className="text-xl font-bold text-red-600">
                {stats.overdueCount} <span className="text-sm font-normal">factures</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Prochaine échéance</div>
            {stats.nextDueDate ? (
              <div className="flex justify-between items-center">
                <div className="font-medium">{format(stats.nextDueDate, 'dd/MM/yyyy')}</div>
                <div className="text-sm">{formatPrice(stats.nextDueAmount)}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">Aucune échéance à venir</div>
            )}
          </div>
        </div>

        {/* Statistiques d'impayés */}
        <div className="bg-white rounded-lg shadow p-4 stats-card">
          <div className="text-sm font-medium mb-3">Suivi des impayés</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Montant impayé</div>
              <div className="text-xl font-bold text-red-600">
                {formatPrice(stats.unpaidAmount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">% du total</div>
              <div className="text-xl font-bold">
                {Math.round((stats.unpaidAmount / stats.totalAmount) * 100) || 0}%
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Facture impayée la plus ancienne</div>
            {stats.oldestUnpaidDate ? (
              <div className="flex justify-between items-center">
                <div className="font-medium">{format(stats.oldestUnpaidDate, 'dd/MM/yyyy')}</div>
                <div className="text-sm">{formatPrice(stats.oldestUnpaidAmount)}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">Aucune facture impayée</div>
            )}
          </div>
        </div>
      </div>

      {/* Affichage des filtres actifs */}
      {(searchTerm || statusFilter || paymentStatusFilter) && (
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
              Statut: {INVOICE_STATUSES[statusFilter as keyof typeof INVOICE_STATUSES]?.label || statusFilter}
              <button 
                onClick={() => setStatusFilter(null)}
              >
                ×
              </button>
            </span>
          )}
          {paymentStatusFilter && (
            <span className="filter-badge">
              Paiement: {PAYMENT_STATUSES[paymentStatusFilter as keyof typeof PAYMENT_STATUSES]?.label || paymentStatusFilter}
              <button 
                onClick={() => setPaymentStatusFilter(null)}
              >
                ×
              </button>
            </span>
          )}
          {(searchTerm || statusFilter || paymentStatusFilter) && (
            <button 
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(null);
                setPaymentStatusFilter(null);
              }}
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune facture trouvée</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter || paymentStatusFilter
              ? "Aucune facture ne correspond à vos critères de recherche." 
              : "Vous n'avez pas encore créé de facture."}
          </p>
          {(searchTerm || statusFilter || paymentStatusFilter) && (
            <button 
              className="mt-4 text-blue-600 hover:text-blue-800"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(null);
                setPaymentStatusFilter(null);
              }}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((invoice, index) => {
            const isOverdue = isInvoiceOverdue(invoice);
            
            return (
              <div 
                key={invoice.id} 
                className={`invoice-card relative flex bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow invoice-card-animate ${
                  invoice.paymentStatus === 'UNPAID' ? 'payment-unpaid' :
                  invoice.paymentStatus === 'PARTIALLY_PAID' ? 'payment-partially-paid' :
                  invoice.paymentStatus === 'PAID' ? 'payment-paid' : ''
                }`}
                style={{ 
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {isOverdue && (
                  <div className="overdue-badge">En retard</div>
                )}
                {invoice.paymentStatus === 'PAID' && (
                  <div className="paid-badge">Payée</div>
                )}
                <div 
                  className={`status-indicator ${
                    invoice.status === 'DRAFT' ? 'status-draft' :
                    invoice.status === 'SENT' ? 'status-sent' :
                    invoice.status === 'PAID' ? 'status-paid' :
                    invoice.status === 'OVERDUE' ? 'status-overdue' :
                    ''
                  }`}
                />
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-500">Client</div>
                      <h3 className="text-lg font-semibold">
                        {invoice.client?.name || 'Non défini'}
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                        invoice.status === 'SENT' ? 'bg-blue-100 text-blue-600' :
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-600' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {INVOICE_STATUSES[invoice.status as keyof typeof INVOICE_STATUSES]?.label || invoice.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="font-medium">
                        <div className="text-sm text-gray-500">Facture n°</div>
                        <div>
                          {invoice.reference || `FAC-${invoice.id.substring(0, 8)}` || 'Sans numéro'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div>{format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Échéance</div>
                        <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {invoice.dueDate 
                            ? format(new Date(invoice.dueDate), 'dd/MM/yyyy')
                            : 'Non définie'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Montant TTC</div>
                        <div className="font-medium">{formatPrice(invoice.totalTTC)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-3 space-x-2">
                    <Link 
                      href={`/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Voir
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link 
                      href={`/invoices/${invoice.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Modifier
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => handlePrint(invoice.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Imprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
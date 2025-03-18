'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Select, Spin, Form, Card, Button, Modal, Input, Checkbox, App, Tooltip, InputNumber, Dropdown } from 'antd';
import type { SelectProps } from 'antd';
import { getNextDevisNumber } from '@/utils/devisSequence';
import { Catalog, Service } from '@/types/Catalog';
import type { Client } from '@/types/Client';
import React from 'react';
import { DownOutlined, RightOutlined, PrinterOutlined, EyeOutlined, FileTextOutlined, DollarOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, WarningOutlined, ArrowUpOutlined, ArrowDownOutlined, MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { DevisPrint } from '@/components/DevisPrint';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { DevisPDF } from '@/components/DevisPDF';
import { getProducts } from '@/lib/products';
import type { Product } from "@prisma/client";
import { DevisWithMaterialsPDF } from '@/components/DevisWithMaterialsPDF';
import { OrderFormPDF } from '@/components/OrderFormPDF';
import { CreateInvoiceFromDevis } from '@/components/CreateInvoiceFromDevis';
import { PAYMENT_METHODS } from '@/types/payment';
import { useSearchParams } from 'next/navigation';
import PrestationsSelector from '@/components/PrestationsSelector';
import { PROJECT_TYPES } from '@/constants/projectTypes';
import ServiceCreator from '@/components/catalogs/ServiceCreator';
import ServiceForm from '@/components/catalogs/ServiceForm';
import CategoryCreator from '@/components/catalogs/CategoryCreator';
import { ProductCategory } from '@/types/Product';

interface DevisNumber {
  number: number;
  year: number;
  reference: string;
  prescriberId?: string;
}

interface Section {
  id: string;
  name: string;
  prestations: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    tva: number;
    amount: number;
    description?: string;
    notes?: string;
    conditions?: string;
    category: { name: string };
    materials: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      unit: string;
      reference?: string;
      tva: number;
      billable: boolean;
    }>;
  }>;
  materialsTotal: number;
  subTotal: number;
  category: { name: string };
}

interface ExtendedService extends Omit<Service, 'categoryId'> {
  categoryName?: string;
  categoryId: string;
}

// Modifier l'interface pour les prestations du catalogue
interface CatalogPrestation {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit?: string;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit?: string;
  }>;
  categoryName: string;
  categoryId: string;
}

// Renommer l'interface locale
interface LocalService {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  tva: number;
  materials: Material[];
}

interface DevisService {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  tva: number;
  materials: Material[];
}

interface DevisMaterial {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  reference?: string;
  tva?: number;
}

interface DevisSection {
  id: string;
  name: string;
  services: DevisService[];
  materialsTotal: number;
  subTotal: number;
}

interface DevisData {
  id: string;
  number: number;
  year: number;
  reference: string;
  status: string;
  contactId: string;
  catalogId: string;
  sections: DevisSection[];
  showDescriptions?: boolean;
}

// Mettre à jour l'interface des totaux
interface Totals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  services: {
    totalHT: number;
    tvaDetails: Array<{
      taux: number;
      ht: number;
      tva: number;
    }>;
  };
  materials: {
    totalHT: number;
    tvaDetails: Array<{
      taux: number;
      ht: number;
      tva: number;
    }>;
  };
}

interface Prescriber {
  id: string;
  nom: string;
  company?: string;
  rue?: string;
  ville?: string;
  cp?: string;
  pays?: string;
}

// Ajouter la constante DEVIS_STATUSES avant le composant
const DEVIS_STATUSES = {
  DRAFT: { label: 'Brouillon', color: 'gray' },
  SENT: { label: 'Envoyé', color: 'blue' },
  ACCEPTED: { label: 'Accepté', color: 'green' },
  REJECTED: { label: 'Refusé', color: 'red' }
};

const companyInfo = {
  name: 'BRAVO TRAVO',
  address: '5 Avenue Ingres, 75016 Paris',
  logo: '/images/logo.png' // Assurez-vous que le chemin est correct
};

interface Material {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string; // Rendre reference optionnel
  tva: number;
  billable: boolean; // Ajouter une propriété 'billable'
}

interface Category {
  name: string;
  services: LocalService[];
}

// Ajouter ce composant en haut du fichier, après les imports
const ReferenceInput = ({ 
  material, 
  sectionId, 
  prestationId, 
  onReferenceChange 
}: { 
  material: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
    reference?: string;
    tva: number;
    billable?: boolean;
  };
  sectionId: string;
  prestationId: string;
  onReferenceChange: (sectionId: string, prestationId: string, materialId: string, reference: string) => void;
}) => {
  // Utiliser directement la référence du matériau, avec une valeur par défaut si elle est undefined
  const [localRef, setLocalRef] = useState(material.reference || '');
  
  // Log détaillé pour débogage
  console.log('ReferenceInput rendu avec:', {
    materialId: material.id,
    materialName: material.name,
    materialReference: material.reference,
    localRefState: localRef
  });
  
  // Mettre à jour l'état local lorsque la référence du matériau change
  useEffect(() => {
    console.log('ReferenceInput useEffect déclenché:', {
      materialId: material.id,
      newReference: material.reference,
      oldLocalRef: localRef
    });
    
    if (material.reference !== localRef) {
      setLocalRef(material.reference || '');
    }
  }, [material.reference, material.id]);
  
  return (
    <input
      type="text"
      value={localRef}
      className="w-24 text-center border-2 border-red-500 rounded p-1"
      onChange={(e) => {
        const newRef = e.target.value;
        console.log('Modification de référence:', {
          materialId: material.id,
          oldRef: localRef,
          newRef
        });
        setLocalRef(newRef);
        onReferenceChange(sectionId, prestationId, material.id, newRef);
      }}
      placeholder="Réf."
    />
  );
};

export default function NewDevisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [devisNumber, setDevisNumber] = useState<DevisNumber | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [prestations, setPrestations] = useState<CatalogPrestation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    services: {
      totalHT: 0,
      tvaDetails: []
    },
    materials: {
      totalHT: 0,
      tvaDetails: []
    }
  });
  const [showPreview, setShowPreview] = useState(false);
  const [prescribers, setPrescribers] = useState<Prescriber[]>([]);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [pilot, setPilot] = useState<string>('Noureddine MLAIEH');
  const [devisComments, setDevisComments] = useState<string>('');
  const [showDevisComments, setShowDevisComments] = useState<boolean>(true);
  const [orderFormComments, setOrderFormComments] = useState<string>('');
  const [showOrderFormComments, setShowOrderFormComments] = useState<boolean>(true);
  const [showDescriptions, setShowDescriptions] = useState<boolean>(false);
  const [showPrestationsSelector, setShowPrestationsSelector] = useState<boolean>(false);
  const [selectedPrestations, setSelectedPrestations] = useState<any[]>([]);
  const [projectType, setProjectType] = useState<string>('AUTRE');
  
  const printRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogServices, setCatalogServices] = useState<ExtendedService[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedPrestations, setExpandedPrestations] = useState<string[]>([]);
  const [expandedMaterials, setExpandedMaterials] = useState<string[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Product[]>([]);
  const [materialSearchValue, setMaterialSearchValue] = useState<string>('');
  const [status, setStatus] = useState('DRAFT');
  const [globalServiceTVA, setGlobalServiceTVA] = useState(20);
  const [globalMaterialTVA, setGlobalMaterialTVA] = useState(20);
  const [selectedPrescriber, setSelectedPrescriber] = useState<string | null>(null);

  // Ajouter ces états pour gérer les modales de confirmation
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [prestationToDelete, setPrestationToDelete] = useState<{sectionId: string, prestationId: string} | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<{sectionId: string, prestationId: string, materialId: string} | null>(null);

  // Ajouter ces états pour les modales de confirmation
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showDeletePrestationModal, setShowDeletePrestationModal] = useState(false);
  const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false);

  // Déterminer si nous sommes en mode édition
  const [isEditMode, setIsEditMode] = useState(false);

  // 1. Ajouter l'état pour prestationSearchValue
  const [prestationSearchValue, setPrestationSearchValue] = useState('');

  // Ajouter ces états
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);

  // Ajouter ces états pour les clients
  const [clientsLoading, setClientsLoading] = useState(true);
  const [loadingPrescribers, setLoadingPrescribers] = useState(true);
  const [showSimpleDevisPreview, setShowSimpleDevisPreview] = useState(false);
  const [showOrderFormPreview, setShowOrderFormPreview] = useState(false);
  const [showDevisWithMaterialsPreview, setShowDevisWithMaterialsPreview] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [materialsWithReferences, setMaterialsWithReferences] = useState<Array<{
    id: string;
    name: string;
    reference: string;
    price: number;
  }>>([]);
  const [logoBase64, setLogoBase64] = useState('');
  
  // État pour la modale de sélection des prestations
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [isServiceCreatorVisible, setIsServiceCreatorVisible] = useState(false);
  const [isCatalogSelectorVisible, setIsCatalogSelectorVisible] = useState(false);
  const [selectedCategoryForService, setSelectedCategoryForService] = useState<string | null>(null);
  const [isCategoryCreatorVisible, setIsCategoryCreatorVisible] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isReloadingCategories, setIsReloadingCategories] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<{id: string, name: string}[]>([]);
  const [originalSearchText, setOriginalSearchText] = useState<string>('');
  
  // Ajouter une référence pour le debounce de la recherche
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Surveiller les changements dans catalogCategories
  useEffect(() => {
    console.log('État catalogCategories mis à jour:', catalogCategories);
  }, [catalogCategories]);

  // Fonction spécifique pour charger les catégories d'un catalogue
  const loadCatalogCategories = async (catalogId: string) => {
    console.log('Chargement des catégories pour le catalogue:', catalogId);
    if (!catalogId) {
      console.error('ID de catalogue non fourni');
      setCatalogCategories([]);
      return [];
    }
    
    // Activer l'indicateur de chargement
    setIsLoading(true);
    setIsReloadingCategories(true);
    
    try {
      // Ajouter un timestamp pour éviter le cache du navigateur
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/catalogs/${catalogId}/categories?t=${timestamp}`);
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des catégories:', response.status);
        const errorText = await response.text();
        console.error('Détails de l\'erreur:', errorText);
        throw new Error(`Erreur lors du chargement des catégories: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Catégories chargées (brut):', data);
      console.log('Nombre de catégories chargées:', data.length);
      
      if (Array.isArray(data) && data.length > 0) {
        const formattedCategories = data.map(category => ({
          id: category.id,
          name: category.name
        }));
        console.log('Catégories formatées:', formattedCategories);
        console.log('Nombre de catégories formatées:', formattedCategories.length);
        setCatalogCategories(formattedCategories);
        return formattedCategories;
      } else {
        console.warn('Aucune catégorie trouvée ou format incorrect');
        setCatalogCategories([]);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCatalogCategories([]);
      return [];
    } finally {
      setIsLoading(false);
      setIsReloadingCategories(false);
    }
  };

  const handlePrint = useReactToPrint({
    documentTitle: `DEVIS-${devisNumber?.reference || ''}`,
    contentRef: printRef,
    onAfterPrint: () => {},
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
    `,
  });

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);
        const response = await fetch('/api/catalogs');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des catalogues');
        }
        const data = await response.json();
        console.log('Catalogues chargés:', data);
        setCatalogs(data);
      } catch (error) {
        console.error('Erreur lors du chargement des catalogues:', error);
        setError('Impossible de charger les catalogues');
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const fetchDevisNumber = useCallback(async () => {
    try {
      setLoading(true); // Activer l'état de chargement
      const { reference } = await getNextDevisNumber();
      setDevisNumber({
        number: 0,
        year: new Date().getFullYear(),
        reference: reference
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du numéro de devis:', error);
      message.error('Impossible de générer le numéro de devis');
    } finally {
      setLoading(false); // Désactiver l'état de chargement, qu'il y ait une erreur ou non
    }
  }, [setLoading, setDevisNumber, message]);

  const loadClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Erreur lors du chargement des clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      message.error('Impossible de charger les clients');
    } finally {
      setClientsLoading(false);
    }
  }, [setClientsLoading, setClients, message]);

  const loadProducts = useCallback(async () => {
    try {
      // Charger tous les produits, pas seulement les matériaux
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des produits');
      }
      const loadedProducts = await response.json();
      
      console.log('Produits chargés:', loadedProducts.length);
      
      // Fonction pour convertir les produits au format attendu
      const convertProduct = (p: any) => ({
        ...p,
        description: p.description || null,
        reference: p.reference || null,
        unit: p.unit !== undefined ? p.unit : null,
        category: p.category || 'MATERIAL'
      });
      
      // Convertir tous les produits
      const productsWithCategories = loadedProducts.map(convertProduct);
      
      // Vérifier les catégories après traitement
      const materialCount = productsWithCategories.filter((p: any) => p.category === 'MATERIAL').length;
      const serviceCount = productsWithCategories.filter((p: any) => p.category === 'SERVICE').length;
      console.log(`Produits par catégorie: ${materialCount} matériaux, ${serviceCount} services`);
      
      // Stocker les produits dans les deux états
      setAvailableMaterials(productsWithCategories.filter((p: any) => p.category === 'MATERIAL'));
      setProducts(productsWithCategories); // Tous les produits
      
      console.log('Nombre total de produits chargés:', productsWithCategories.length);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      message.error('Impossible de charger les produits');
    }
  }, [setAvailableMaterials, setProducts, message]);

  const loadPrescribers = useCallback(async () => {
    try {
      setLoadingPrescribers(true);
      const response = await fetch('/api/prescribers');
      if (!response.ok) throw new Error('Erreur lors du chargement des prescripteurs');
      const data = await response.json();
      console.log('Prescripteurs chargés:', data);
      setPrescribers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des prescripteurs:', error);
      message.error('Impossible de charger les prescripteurs');
    } finally {
      setLoadingPrescribers(false);
    }
  }, [setLoadingPrescribers, setPrescribers, message]);

  // Utiliser les fonctions useCallback dans les useEffect
  useEffect(() => {
    fetchDevisNumber();
  }, [fetchDevisNumber]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadPrescribers();
  }, [loadPrescribers]);

  useEffect(() => {
    const loadDevisData = async () => {
      try {
        const pathParts = window.location.pathname.split('/');
        const devisId = pathParts[pathParts.indexOf('devis') + 1];
        
        if (devisId && devisId !== 'new') {
          setIsLoading(true);
          setIsEditMode(true);

          // Charger d'abord les données de référence
          const [catalogsResponse, prescribersResponse] = await Promise.all([
            fetch('/api/catalogs'),
            fetch('/api/prescribers')
          ]);

          const [catalogsData, prescribersData] = await Promise.all([
            catalogsResponse.json(),
            prescribersResponse.json()
          ]);

          setCatalogs(catalogsData);
          setPrescribers(prescribersData);

          // Charger ensuite les données du devis
          const devisResponse = await fetch(`/api/devis/${devisId}`);
          if (!devisResponse.ok) throw new Error('Erreur lors du chargement du devis');

          const devisData = await devisResponse.json();
          console.log('Données du devis chargées:', devisData);

          // Mise à jour des données de base
          setDevisNumber({
            number: devisData.number,
            year: devisData.year,
            reference: devisData.reference,
            prescriberId: devisData.prescriberId
          });

          // Mise à jour immédiate des sélections
          setSelectedClient(devisData.clientId);
          // Supprimer la référence à setSelectedContact
          // setSelectedContact(devisData.contactId);
          setSelectedCatalogId(devisData.catalogId);
          if (devisData.prescriberId) {
            setSelectedPrescriber(devisData.prescriberId);
          }
          setGlobalServiceTVA(devisData.globalServiceTVA);
          setGlobalMaterialTVA(devisData.globalMaterialTVA);
          setStatus(devisData.status);
          setPaymentMethod(devisData.paymentMethod || 'Virement bancaire');

          // Mise à jour de la date d'expiration
          if (devisData.expirationDate) {
            const date = new Date(devisData.expirationDate);
            setExpirationDate(date.toISOString().split('T')[0]);
          }

          // Mise à jour des sections
          if (devisData.sections) {
            const formattedSections = devisData.sections.map((section: any) => ({
              id: section.id,
              name: section.name,
              prestations: section.services.map((service: any) => ({
                id: service.id,
                name: service.name,
                description: service.description || '',
                quantity: service.quantity,
                unit: service.unit || 'm²',
                unitPrice: service.price,
                tva: service.tva,
                amount: service.price * service.quantity,
                materials: service.materials.map(m => ({
                  id: Math.random().toString(36).substr(2, 9),
                  name: m.name,
                  quantity: m.quantity,
                  price: m.price,
                  unit: m.unit || 'unité',
                  reference: m.reference || '',
                  tva: globalMaterialTVA,
                  billable: false // Par défaut, le matériau n'est PAS facturable
                }))
              })),
              materialsTotal: section.materialsTotal,
              subTotal: section.subTotal
            }));

            setSections(formattedSections);
            console.log('Sections chargées avec matériaux:', formattedSections);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du devis:', error);
        message.error('Impossible de charger le devis');
      } finally {
        setIsLoading(false);
      }
    };

    loadDevisData();
  }, []);

  const handleCatalogChange = async (catalogId: string) => {
    console.log('handleCatalogChange appelé avec catalogId:', catalogId);
    setSelectedCatalogId(catalogId);
    setIsLoading(true);
    
    try {
      // Réinitialiser les catégories avant de charger les nouvelles
      setCatalogCategories([]);
      setSelectedCategoryForService(null);
      
      // Charger les catégories du catalogue
      const categories = await loadCatalogCategories(catalogId);
      console.log('Catégories chargées dans handleCatalogChange:', categories);
      
      // Vérifier si les catégories ont été chargées correctement
      if (!categories || categories.length === 0) {
        console.warn('Aucune catégorie trouvée pour ce catalogue, tentative de rechargement...');
        // Faire une seconde tentative après un court délai
        setTimeout(async () => {
          const retryCategories = await loadCatalogCategories(catalogId);
          console.log('Résultat de la seconde tentative:', retryCategories);
        }, 500);
      }
      
      // Utiliser le même endpoint que la page d'édition pour charger les prestations
      console.log('Envoi de la requête à /api/catalogs/' + catalogId);
      const response = await fetch(`/api/catalogs/${catalogId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Réponse API non OK:', response.status, errorData);
        throw new Error(errorData.error || 'Erreur lors du chargement des prestations');
      }
      
      const catalogData = await response.json();
      console.log('Données du catalogue chargées (brut):', catalogData);
      
      if (!catalogData.categories || !Array.isArray(catalogData.categories)) {
        console.error('Format de données invalide: pas de catégories ou format incorrect');
        console.log('Type de catalogData.categories:', typeof catalogData.categories);
        throw new Error('Format de données invalide');
      }
      
      // Extraire les services de toutes les catégories
      const formattedPrestations = catalogData.categories.flatMap((category: any) => 
        category.services.map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          quantity: service.quantity || 1,
          unit: service.unit || 'm²',
          materials: service.materials || [],
          categoryName: category.name,
          categoryId: category.id
        }))
      );

      console.log('Prestations formatées:', formattedPrestations.length);
      setPrestations(formattedPrestations);
      
      // Mettre à jour également les options de prestations pour le Select
      const options = formattedPrestations.map((prestation: { 
        id: string; 
        name: string; 
        price: number;
        categoryName: string;
      }) => ({
        label: `${prestation.categoryName} - ${prestation.name} - ${prestation.price}€`,
        value: prestation.id
      }));
      
      console.log('Options de prestations:', options.length);
      
    } catch (error) {
      console.error('Erreur lors du chargement des prestations:', error);
      message.error('Impossible de charger les prestations du catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (value: string) => {
    console.log('handleSearch appelé avec:', value);
    setSearchValue(value);
    setPrestationSearchValue(value);
    
    // Si la valeur est vide, ne rien faire
    if (value.length === 0) {
      return;
    }

    // Si nous avons des prestations, les filtrer selon la recherche
    if (prestations.length > 0) {
      console.log('Filtrage des prestations existantes');
      const filteredPrestations = prestations.filter(prestation =>
        prestation.name.toLowerCase().includes(value.toLowerCase()) ||
        (prestation.description?.toLowerCase() || '').includes(value.toLowerCase())
      );
      
      console.log('Prestations filtrées:', filteredPrestations.length);
    } else {
      console.log('Aucune prestation disponible pour la recherche');
    }
  };

  const prestationOptions: SelectProps['options'] = prestations.map((prestation: { 
    id: string; 
    name: string; 
    price: number;  // Ajout de la propriété price
    unit?: string;
  }) => ({
    label: `${prestation.name} - ${prestation.price}€`,
    value: prestation.id
  }));

  const handleAddSection = () => {
    const newSection: Section = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Nouvelle section',
      prestations: [],
      materialsTotal: 0,
      subTotal: 0,
      category: { name: '' }
    };
    setSections([...sections, newSection]);
  };

  // 1. Corriger la fonction handleAddPrestation pour gérer correctement les prestations
  const handleAddPrestation = async (sectionId: string, prestationId: string) => {
    try {
      // Trouver la prestation dans le catalogue
      const prestation = prestations.find(p => p.id === prestationId);
      if (!prestation) {
        console.error('Prestation non trouvée:', prestationId);
        return;
      }

      console.log('Prestation sélectionnée:', prestation);

      // Vérifier si la prestation a des matériaux
      if (!prestation.materials || !Array.isArray(prestation.materials)) {
        console.warn('La prestation n\'a pas de matériaux ou materials n\'est pas un tableau:', prestation);
        prestation.materials = []; // Initialiser un tableau vide si undefined
      }

      // Créer un nouvel ID unique pour la prestation
      const newPrestationId = Math.random().toString(36).substr(2, 9);

      // Préparer les matériaux avec leurs références
      const materialsWithReferences = await Promise.all(prestation.materials.map(async (material) => {
        // Trouver le matériau complet dans availableMaterials pour obtenir sa référence
        const fullMaterial = availableMaterials.find(m => m.name === material.name);
        
        console.log('Matériau trouvé dans le catalogue:', {
          name: material.name,
          fullMaterial: fullMaterial
        });

        // Utiliser la référence du matériau complet ou générer une référence aléatoire
        const reference = fullMaterial?.reference || `REF-${Math.floor(Math.random() * 10000)}`;
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: material.name,
          quantity: material.quantity || 1,
          price: material.price || 0,
          unit: material.unit || 'unité',
          reference: reference, // Utiliser la référence trouvée ou générée
          tva: globalMaterialTVA,
          billable: false // Ajouter cette propriété
        };
      }));

      // Log pour vérifier les matériaux avec références
      console.log('Matériaux avec références:', materialsWithReferences);

      // Créer la nouvelle prestation avec les matériaux qui ont des références
      const newPrestation = {
        id: newPrestationId,
        name: prestation.name,
        description: prestation.description || '',
        quantity: 1,
        unit: prestation.unit || 'm²',
        unitPrice: prestation.price,
        tva: globalServiceTVA,
        amount: prestation.price,
        category: { name: prestation.categoryName || '' },
        materials: materialsWithReferences
      };

      // Mettre à jour les sections
      setSections(prevSections => {
        return prevSections.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              prestations: [...section.prestations, newPrestation]
            };
          }
          return section;
        });
      });

      // Réinitialiser la recherche
      setPrestationSearchValue('');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la prestation:', error);
      message.error('Erreur lors de l\'ajout de la prestation');
    }
  };

  const handlePrestationQuantityChange = (
    sectionId: string,
    prestationId: string,
    newQuantity: number
  ) => {
    // Arrondir à 2 décimales
    const roundedQuantity = Math.round(newQuantity * 100) / 100;
    
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                quantity: roundedQuantity,
                amount: roundedQuantity * prestation.unitPrice
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handleMaterialQuantityChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newQuantity: number
  ) => {
    // Arrondir à 2 décimales
    const roundedQuantity = Math.round(newQuantity * 100) / 100;
    
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return {
                      ...material,
                      quantity: roundedQuantity
                    };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handlePriceChange = (sectionId: string, prestationId: string, newPrice: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                unitPrice: Math.max(0, newPrice), // Empêcher les prix négatifs
                amount: Math.max(0, newPrice) * prestation.quantity
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handleMaterialUnitChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newUnit: string
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return {
                      ...material,
                      unit: newUnit
                    };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handleMaterialPriceChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newPrice: number
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return {
                      ...material,
                      price: Math.max(0, newPrice)
                    };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  const handleAddMaterial = (sectionId: string, prestationId: string, materialId: string) => {
    const material = availableMaterials.find(m => m.id === materialId);
    if (!material) return;

    // Forcer une référence pour chaque matériau
    const forcedReference = material.reference || `REF-${Math.floor(Math.random() * 10000)}`;
    
    // Log détaillé pour débogage
    console.log('Ajout de matériau avec référence forcée:', {
      materialId,
      materialName: material.name,
      originalReference: material.reference,
      forcedReference
    });

    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      name: material.name,
      quantity: 1,
      price: material.sellingPrice,
      unit: material.unit || 'unité',
      reference: material.reference || '', // Utiliser une chaîne vide comme valeur par défaut
      tva: globalMaterialTVA,
      billable: false // Par défaut, le matériau n'est PAS facturable
    };

    // Mettre à jour les sections avec le nouveau matériau
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            prestations: section.prestations.map(prestation => {
              if (prestation.id === prestationId) {
                return {
                  ...prestation,
                  materials: [...prestation.materials, newMaterial]
                };
              }
              return prestation;
            })
          };
        }
        return section;
      });
    });

    setMaterialSearchValue('');
  };

  const handleMaterialReferenceChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    reference: string
  ) => {
    console.log('handleMaterialReferenceChange appelé:', {
      sectionId,
      prestationId,
      materialId,
      reference
    });
    
    setSections(prevSections => {
      // Créer une copie profonde des sections pour éviter les problèmes de référence
      const deepCopy = JSON.parse(JSON.stringify(prevSections));
      
      const updatedSections = deepCopy.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            prestations: section.prestations.map(prestation => {
              if (prestation.id === prestationId) {
                return {
                  ...prestation,
                  materials: prestation.materials.map(material => {
                    if (material.id === materialId) {
                      console.log('Mise à jour de la référence:', {
                        materialId,
                        oldReference: material.reference,
                        newReference: reference
                      });
                      return {
                        ...material,
                        reference: reference
                      };
                    }
                    return material;
                  })
                };
              }
              return prestation;
            })
          };
        }
        return section;
      });
      
      // Vérifier que la mise à jour a bien été effectuée
      const updatedSection = updatedSections.find(s => s.id === sectionId);
      const updatedPrestation = updatedSection?.prestations.find(p => p.id === prestationId);
      const updatedMaterial = updatedPrestation?.materials.find(m => m.id === materialId);
      
      console.log('Résultat de la mise à jour:', {
        materialId,
        updatedReference: updatedMaterial?.reference,
        referenceMatchesInput: updatedMaterial?.reference === reference
      });
      
      return updatedSections;
    });
  };

  const calculateTotals = (currentSections: Section[]): Totals => {
    const servicesByTVA: { [key: number]: { ht: number; tva: number } } = {};
    const materialsByTVA: { [key: number]: { ht: number; tva: number } } = {};

    // Calculer les totaux pour chaque section sans les mettre à jour
    const updatedSections = currentSections.map(section => {
      let sectionMaterialsTotal = 0;
      let sectionServicesTotal = 0;

      section.prestations.forEach(prestation => {
        const tauxTVA = prestation.tva;
        
        // Calcul pour les services
        if (!servicesByTVA[tauxTVA]) {
          servicesByTVA[tauxTVA] = { ht: 0, tva: 0 };
        }
        const prestationHT = prestation.quantity * prestation.unitPrice;
        sectionServicesTotal += prestationHT;
        servicesByTVA[tauxTVA].ht += prestationHT;
        servicesByTVA[tauxTVA].tva += prestationHT * (tauxTVA / 100);

        // Calcul pour les matériaux
        if (!materialsByTVA[tauxTVA]) {
          materialsByTVA[tauxTVA] = { ht: 0, tva: 0 };
        }
        prestation.materials.forEach(material => {
          const materialHT = material.quantity * material.price;
          sectionMaterialsTotal += materialHT;
          materialsByTVA[tauxTVA].ht += materialHT;
          materialsByTVA[tauxTVA].tva += materialHT * (tauxTVA / 100);
        });
      });

      return {
        ...section,
        materialsTotal: sectionMaterialsTotal,
        subTotal: sectionServicesTotal
      };
    });

    // Mettre à jour les sections une seule fois, en dehors du calcul des totaux
    setSections(updatedSections);

    // Calculer les totaux des services
    const servicesTotals = {
      totalHT: Object.values(servicesByTVA).reduce((sum, { ht }) => sum + ht, 0),
      tvaDetails: Object.entries(servicesByTVA).map(([taux, { ht, tva }]) => ({
        taux: Number(taux),
        ht,
        tva
      }))
    };

    // Calculer les totaux des matériaux
    const materialsTotals = {
      totalHT: Object.values(materialsByTVA).reduce((sum, { ht }) => sum + ht, 0),
      tvaDetails: Object.entries(materialsByTVA).map(([taux, { ht, tva }]) => ({
        taux: Number(taux),
        ht,
        tva
      }))
    };

    // Calculer les totaux globaux
    const totalHT = servicesTotals.totalHT + materialsTotals.totalHT;
    const totalTVA = [...servicesTotals.tvaDetails, ...materialsTotals.tvaDetails]
      .reduce((sum, { tva }) => sum + tva, 0);

    // Créer et retourner l'objet Totals
    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
      services: servicesTotals,
      materials: materialsTotals
    };
  };

  useEffect(() => {
    if (sections.length > 0) {
      const newTotals = calculateTotals([...sections]); // Passer une copie des sections
      setTotals(newTotals); // Mettre à jour l'état avec les nouveaux totaux
    }
  }, [JSON.stringify(sections)]); // Dépendre d'une version stringifiée des sections

  const handleSaveDevis = async (status = 'DRAFT') => {
    try {
      setIsLoading(true);
      
      // Vérification que devisNumber n'est pas null
      if (!devisNumber) {
        message.error('Numéro de devis non disponible');
        return;
      }

      // Vérification que le contact est sélectionné
      if (!selectedClient) {
        message.error('Veuillez sélectionner un client');
        return;
      }

      // Préparer les données du devis
      const devisData = {
        status: status,
        clientId: selectedClient,
        catalogId: selectedCatalogId,
        prescriberId: devisNumber.prescriberId,
        expirationDate: expirationDate,
        paymentMethod: paymentMethod,
        pilot: pilot,
        projectType: projectType,
        devisComments: devisComments,
        showDevisComments: showDevisComments,
        orderFormComments: orderFormComments,
        showOrderFormComments: showOrderFormComments,
        showDescriptions: showDescriptions,
        sections: sections.map(section => ({
          name: section.name,
          materialsTotal: section.materialsTotal || 0,
          subTotal: section.subTotal || 0,
          category: typeof section.category === 'object' ? section.category.name : 'DEFAULT',
          // Renommer prestations en services pour correspondre au schéma Prisma
          services: section.prestations.map(prestation => ({
            name: prestation.name,
            quantity: prestation.quantity || 0,
            unit: prestation.unit || '',
            price: prestation.unitPrice || 0,
            tva: prestation.tva || 20,
            description: prestation.description || '',
            category: typeof prestation.category === 'object' ? prestation.category.name : 'SERVICE',
            materials: prestation.materials.map(material => ({
              name: material.name,
              quantity: material.quantity || 0,
              price: material.price || 0,
              unit: material.unit || '',
              reference: material.reference || '',
              tva: material.tva || 20,
              billable: material.billable !== false
            }))
          }))
        })),
      };

      // Log détaillé pour débogage
      console.log('Données complètes à envoyer (JSON):', JSON.stringify(devisData, null, 2));

      // Log des sections et services
      console.log('Sections à envoyer:', devisData.sections.map((section: any, index: number) => ({
        index,
        name: section.name,
        servicesCount: section.services?.length || 0
      })));

      // Envoyer les données au serveur
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(devisData),
      });

      // Log de la réponse pour débogage
      console.log('Statut de la réponse:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur détaillée:', errorData);
        console.error('Statut de la réponse:', response.status);
        console.error('Données envoyées qui ont causé l\'erreur:', JSON.stringify(devisData, null, 2));
        throw new Error(`Erreur lors de la sauvegarde du devis: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      message.success('Devis enregistré avec succès');
      
      // Ajouter un petit délai avant la redirection pour s'assurer que les données sont enregistrées
      setTimeout(() => {
        router.push('/devis');
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      if (error instanceof Error) {
        message.error(`Erreur lors de la sauvegarde: ${error.message}`);
      } else {
        message.error('Erreur lors de la sauvegarde du devis');
      }
    }
  };

  const handleGlobalServiceTVAChange = (newTVA: number) => {
    setGlobalServiceTVA(newTVA);
    setSections(sections.map(section => ({
      ...section,
      prestations: section.prestations.map(prestation => ({
        ...prestation,
        tva: newTVA
      }))
    })));
  };

  const handleGlobalMaterialTVAChange = (newTVA: number) => {
    setGlobalMaterialTVA(newTVA);
    setSections(sections.map(section => ({
      ...section,
      prestations: section.prestations.map(prestation => ({
        ...prestation,
        materials: prestation.materials.map(material => ({
          ...material,
          tva: newTVA
        }))
      }))
    })));
  };

  const renderTotalsFooter = () => {
    if (!totals) return null;

    console.log('paymentMethod:', paymentMethod);

    return (
      <div className="mt-8 bg-white border-t shadow-lg p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            {/* Boutons d'aperçu et téléchargement */}
            <div className="flex gap-4">
              <Button 
                icon={<EyeOutlined />}
                onClick={() => setShowSimpleDevisPreview(true)}
              >
                Aperçu devis simple
              </Button>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => setShowDevisWithMaterialsPreview(true)}
              >
                Aperçu devis détaillé
              </Button>
              <Button 
                icon={<EyeOutlined />}
                onClick={() => setShowOrderFormPreview(true)}
              >
                Aperçu bon de commande
              </Button>
              <Button 
                icon={<FileTextOutlined />}
                onClick={() => {
                  message.info("Veuillez d'abord sauvegarder le devis avant de créer une facture.");
                }}
              >
                Créer une facture
              </Button>
            </div>

            {/* Totaux */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-right font-semibold">Services:</div>
                  <div>HT {totals.services.totalHT.toFixed(2)} €</div>
                  {totals.services.tvaDetails.map(({ taux, tva }) => (
                    <div key={`service-tva-${taux}`}>TVA {taux}% {tva.toFixed(2)} €</div>
                  ))}
                  <div>TTC {(totals.services.totalHT + totals.services.tvaDetails.reduce((acc, { tva }) => acc + tva, 0)).toFixed(2)} €</div>

                  <div className="text-right font-semibold">Matériaux:</div>
                  <div>HT {totals.materials.totalHT.toFixed(2)} €</div>
                  {totals.materials.tvaDetails.map(({ taux, tva }) => (
                    <div key={`material-tva-${taux}`}>TVA {taux}% {tva.toFixed(2)} €</div>
                  ))}
                  <div>TTC {(totals.materials.totalHT + totals.materials.tvaDetails.reduce((acc, { tva }) => acc + tva, 0)).toFixed(2)} €</div>

                  <div className="text-right font-semibold">Total:</div>
                  <div>HT {totals.totalHT.toFixed(2)} €</div>
                  <div>TVA {totals.totalTVA.toFixed(2)} €</div>
                  <div>TTC {totals.totalTTC.toFixed(2)} €</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePreviewClick = () => {
    console.log('Date d\'expiration au clic preview:', expirationDate);
    setShowSimpleDevisPreview(true);
  };

  const handleTVAChange = (sectionId: string, prestationId: string, newTVA: number) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                tva: newTVA
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Ajouter les fonctions de suppression
  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    setSectionToDelete(null);
  };

  const handleDeletePrestation = (sectionId: string, prestationId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.filter(p => p.id !== prestationId)
        };
      }
      return section;
    }));
    setPrestationToDelete(null);
  };

  const handleDeleteMaterial = (sectionId: string, prestationId: string, materialId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
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
    setMaterialToDelete(null);
  };

  // Dans le rendu, ajouter un useEffect pour déboguer
  useEffect(() => {
    console.log('DevisNumber mis à jour:', devisNumber);
    // Supprimer la référence à contacts et selectedContact
  }, [devisNumber]);

  // Ajoutez ce code temporairement pour vérifier les matériaux chargés
  useEffect(() => {
    const loadMaterialsWithReferences = async () => {
      try {
        const response = await fetch('/api/products?category=MATERIAL');
        if (!response.ok) throw new Error('Erreur lors du chargement des matériaux');
        
        const materials = await response.json();
        
        // Vérifier si les matériaux ont des références
        const materialsWithReferences = materials.filter(m => m.reference && m.reference.trim() !== '');
        console.log('Matériaux avec références:', materialsWithReferences);
        console.log('Nombre de matériaux avec références:', materialsWithReferences.length);
        console.log('Nombre total de matériaux:', materials.length);
        
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    
    loadMaterialsWithReferences();
  }, []);

  // Ajouter une fonction pour gérer le changement d'état de facturation
  const handleMaterialBillableChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    billable: boolean
  ) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            prestations: section.prestations.map(prestation => {
              if (prestation.id === prestationId) {
                return {
                  ...prestation,
                  materials: prestation.materials.map(material => {
                    if (material.id === materialId) {
                      return {
                        ...material,
                        billable
                      };
                    }
                    return material;
                  })
                };
              }
              return prestation;
            })
          };
        }
        return section;
      });
    });
  };

  // Ajouter cette fonction avec les autres gestionnaires d'événements
  const handleMaterialNameChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newName: string
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return { ...material, name: newName };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Ajouter cette fonction avec les autres gestionnaires d'événements
  const handleMaterialTVAChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newTVA: number
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return {
                      ...material,
                      tva: newTVA
                    };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Fonction pour gérer la sélection d'un matériau depuis la liste disponible
  const handleMaterialSelect = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    selectedProduct: any
  ) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: prestation.materials.map(material => {
                  if (material.id === materialId) {
                    return {
                      ...material,
                      name: selectedProduct.name,
                      price: selectedProduct.sellingPrice || selectedProduct.price,
                      unit: selectedProduct.unit || material.unit,
                      reference: selectedProduct.reference || '',
                      tva: selectedProduct.tva || material.tva
                    };
                  }
                  return material;
                })
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Fonction pour déplacer une prestation vers le haut dans une section
  const handleMovePrestationUp = (sectionId: string, prestationId: string) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          const prestationIndex = section.prestations.findIndex(p => p.id === prestationId);
          if (prestationIndex > 0) {
            // Créer une copie du tableau des prestations
            const updatedPrestations = [...section.prestations];
            // Échanger la prestation avec celle au-dessus
            [updatedPrestations[prestationIndex], updatedPrestations[prestationIndex - 1]] = 
            [updatedPrestations[prestationIndex - 1], updatedPrestations[prestationIndex]];
            
            return {
              ...section,
              prestations: updatedPrestations
            };
          }
        }
        return section;
      });
    });
  };

  // Fonction pour déplacer une prestation vers le bas dans une section
  const handleMovePrestationDown = (sectionId: string, prestationId: string) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          const prestationIndex = section.prestations.findIndex(p => p.id === prestationId);
          if (prestationIndex < section.prestations.length - 1) {
            // Créer une copie du tableau des prestations
            const updatedPrestations = [...section.prestations];
            // Échanger la prestation avec celle en-dessous
            [updatedPrestations[prestationIndex], updatedPrestations[prestationIndex + 1]] = 
            [updatedPrestations[prestationIndex + 1], updatedPrestations[prestationIndex]];
            
            return {
              ...section,
              prestations: updatedPrestations
            };
          }
        }
        return section;
      });
    });
  };

  // Ajouter un useEffect pour charger les prestations lorsque le catalogue est sélectionné
  useEffect(() => {
    if (selectedCatalogId) {
      console.log('Catalogue sélectionné, chargement des prestations:', selectedCatalogId);
      const loadCatalogPrestations = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/catalogs/${selectedCatalogId}`);
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du catalogue');
          }
          const catalogData = await response.json();
          console.log('Données du catalogue chargées dans useEffect:', catalogData);

          if (!catalogData.categories || catalogData.categories.length === 0) {
            console.log('Le catalogue ne contient aucune catégorie');
            setPrestations([]);
            return;
          }

          // Extraire les services de toutes les catégories
          const formattedPrestations = catalogData.categories.flatMap((category: any) => 
            category.services.map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              quantity: service.quantity || 1,
              unit: service.unit || 'm²',
              materials: service.materials || [],
              categoryName: category.name,
              categoryId: category.id
            }))
          );

          console.log('Prestations formatées dans useEffect:', formattedPrestations.length);
          setPrestations(formattedPrestations);
        } catch (error) {
          console.error('Erreur lors du chargement des prestations dans useEffect:', error);
          message.error('Impossible de charger les prestations du catalogue');
        } finally {
          setIsLoading(false);
        }
      };

      loadCatalogPrestations();
    } else {
      console.log('Aucun catalogue sélectionné dans useEffect');
      setPrestations([]);
    }
  }, [selectedCatalogId]);

  // Ajouter un useEffect pour surveiller les changements dans prestations
  useEffect(() => {
    console.log('Prestations mises à jour:', prestations.length);
  }, [prestations]);

  // Fonction pour gérer la création d'une nouvelle prestation
  const handleServiceCreated = (newService: any) => {
    // Fermer la modale
    setIsServiceCreatorVisible(false);
    
    // Réinitialiser le champ de recherche
    setPrestationSearchValue('');
    
    // Forcer le rechargement des prestations
    if (selectedCatalogId) {
      // Recharger les prestations du catalogue
      const loadCatalogPrestations = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/catalogs/${selectedCatalogId}`);
          if (!response.ok) {
            throw new Error('Erreur lors du chargement du catalogue');
          }
          const catalogData = await response.json();
          
          if (!catalogData.categories || catalogData.categories.length === 0) {
            console.log('Le catalogue ne contient aucune catégorie');
            setPrestations([]);
            return;
          }

          // Extraire les services de toutes les catégories
          const formattedPrestations = catalogData.categories.flatMap((category: any) => 
            category.services.map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              quantity: service.quantity || 1,
              unit: service.unit || 'm²',
              materials: service.materials || [],
              categoryName: category.name,
              categoryId: category.id
            }))
          );

          console.log('Prestations rechargées après création:', formattedPrestations.length);
          setPrestations(formattedPrestations);
        } catch (error) {
          console.error('Erreur lors du rechargement des prestations:', error);
          message.error('Impossible de recharger les prestations du catalogue');
        } finally {
          setIsLoading(false);
        }
      };

      loadCatalogPrestations();
    }
    
    // Ajouter la nouvelle prestation à la section courante
    if (currentSectionId && newService) {
      const newPrestation = {
        id: Math.random().toString(36).substr(2, 9),
        name: newService.name,
        quantity: 1,
        unit: newService.unit || 'm²', // Utiliser la valeur de newService.unit
        unitPrice: newService.price || 0,
        tva: globalServiceTVA,
        amount: newService.price || 0,
        description: newService.description || '',
        notes: '',
        conditions: '',
        category: { name: newService.categoryName || '' },
        materials: (newService.materials || []).map((material: any) => {
          console.log('Matériau à ajouter à la prestation:', material);
          
          // Vérifier si le matériau a toutes les informations nécessaires
          if (!material.name || material.name === 'Matériau') {
            console.log('Matériau sans nom ou avec nom générique, recherche par ID:', material.id);
            // Essayer de récupérer les informations du matériau à partir de l'ID
            const product = availableMaterials.find(m => m.id === material.id);
            if (product) {
              console.log('Produit trouvé pour le matériau:', product);
              return {
                id: Math.random().toString(36).substr(2, 9),
                name: product.name,
                quantity: material.quantity || 1,
                price: product.sellingPrice || 0,
                unit: product.unit || 'u',
                reference: product.reference || '',
                tva: globalMaterialTVA,
                billable: false
              };
            } else {
              console.log('Aucun produit trouvé pour le matériau avec ID:', material.id);
            }
          }
          
          // Utiliser les informations du matériau telles quelles
          const result = {
            id: Math.random().toString(36).substr(2, 9),
            name: material.name || 'Matériau',
            quantity: material.quantity || 1,
            price: material.price || 0,
            unit: material.unit || 'u',
            reference: material.reference || '',
            tva: globalMaterialTVA,
            billable: false
          };
        })
      };
      
      // Ajouter la prestation à la section
      const updatedSections = sections.map(section => {
        if (section.id === currentSectionId) {
          return {
            ...section,
            prestations: [...section.prestations, newPrestation],
            subTotal: section.subTotal + newPrestation.amount
          };
        }
        return section;
      });
      
      setSections(updatedSections);
      
      // Recalculer les totaux
      const newTotals = calculateTotals(updatedSections);
      setTotals(newTotals);
      
      message.success(`Prestation "${newService.name}" ajoutée à la section`);
    }
  };

  // Fonction pour gérer la création d'une catégorie
  const handleCategoryCreated = (newCategory: any) => {
    console.log('Nouvelle catégorie créée:', newCategory);
    
    // Fermer la modale de création de catégorie
    setIsCategoryCreatorVisible(false);
    
    // Indiquer que la création de catégorie est terminée
    setIsCreatingCategory(false);
    
    // Recharger les catégories du catalogue
    if (selectedCatalogId) {
      loadCatalogCategories(selectedCatalogId).then(() => {
        // Présélectionner la nouvelle catégorie
        setSelectedCategoryForService(newCategory.id);
        
        // Afficher un message de succès
        message.success(`Catégorie "${newCategory.name}" créée avec succès`);
      });
    }
  };

  // Effet pour charger les catégories lorsqu'un catalogue est sélectionné
  useEffect(() => {
    if (selectedCatalogId && isCatalogSelectorVisible) {
      console.log('Effet déclenché: chargement des catégories pour le catalogue:', selectedCatalogId);
      loadCatalogCategories(selectedCatalogId);
    }
  }, [selectedCatalogId, isCatalogSelectorVisible]);

  // Fonction pour continuer vers la création de prestation après sélection de catégorie
  const continueToServiceCreation = (categoryId: string) => {
    setSelectedCategoryForService(categoryId);
    setIsCatalogSelectorVisible(false);
    
    // Récupérer le nom de la catégorie sélectionnée
    const selectedCategory = catalogCategories.find(cat => cat.id === categoryId);
    const categoryName = selectedCategory ? selectedCategory.name : '';
    
    // Si un texte de recherche original existe, l'utiliser
    if (originalSearchText && originalSearchText.trim() !== '') {
      console.log('Utilisation du texte de recherche original:', originalSearchText);
      setPrestationSearchValue(originalSearchText);
    } 
    // Sinon, utiliser un nom par défaut basé sur la catégorie
    else {
      const defaultPrestationName = `${categoryName} - Nouvelle prestation`;
      console.log('Utilisation du nom par défaut:', defaultPrestationName);
      setPrestationSearchValue(defaultPrestationName);
    }
    
    // Ouvrir la modale de création de prestation
    setIsServiceCreatorVisible(true);
  };

  // Ajouter un useEffect pour écouter l'événement materialCreated
  useEffect(() => {
    const handleMaterialCreated = (event: any) => {
      const { material } = event.detail;
      console.log('Événement materialCreated reçu:', material);
      
      // Fonction pour convertir les produits au format attendu
      const convertMaterial = (p: any): Product => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        reference: p.reference || null,
        unit: p.unit !== undefined ? p.unit : null,
        cost: typeof p.cost === 'number' ? p.cost : 0,
        sellingPrice: typeof p.sellingPrice === 'number' ? p.sellingPrice : 0,
        category: 'MATERIAL' as ProductCategory,
        createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(),
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt : new Date()
      });
      
      // Ajouter le matériau à la liste des produits
      setProducts(prevProducts => {
        // Vérifier si le matériau existe déjà dans la liste
        if (prevProducts.some(p => p.id === material.id)) {
          return prevProducts;
        }
        
        // Convertir le matériau au format attendu
        const convertedMaterial = convertMaterial(material);
        
        // Ajouter le matériau à la liste
        return [...prevProducts, convertedMaterial];
      });
      
      // Ajouter le matériau à la liste des matériaux disponibles
      setAvailableMaterials(prevMaterials => {
        // Vérifier si le matériau existe déjà dans la liste
        if (prevMaterials.some(m => m.id === material.id)) {
          return prevMaterials;
        }
        
        // Convertir le matériau au format attendu
        const convertedMaterial = convertMaterial(material);
        
        // Ajouter le matériau à la liste
        return [...prevMaterials, convertedMaterial];
      });
    };
    
    // Ajouter l'écouteur d'événement
    window.addEventListener('materialCreated', handleMaterialCreated);
    
    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('materialCreated', handleMaterialCreated);
    };
  }, []);

  if (loading || catalogsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Chargement..." />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Erreur: {error}</div>;
  }

  if (!devisNumber) {
    return <div className="text-center p-4">Impossible de générer le numéro de devis</div>;
  }

  // Au début du composant, ajoutez un console.log pour vérifier la valeur initiale
  console.log('expirationDate initial:', expirationDate);
  
  // Fonction pour obtenir les informations de contact
  const getContactInfo = () => {
    const clientInfo = clients.find(c => c.id === selectedClient);
    return {
      name: clientInfo?.name || '',
      address: clientInfo?.address || '',
      postalCode: clientInfo?.postalCode || '',
      city: clientInfo?.city || '',
      country: clientInfo?.country || '',
      phone: clientInfo?.phone || '',
      prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
    };
  };

  // Fonction utilitaire pour la recherche normalisée
  const normalizedSearch = (input: string, option: any) => {
    if (!input) return true;
    
    // Récupérer le label et normaliser (supprimer les accents, mettre en minuscule)
    const label = (option?.label as string || '').toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Normaliser l'entrée de recherche
    const searchInput = input.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Diviser en mots-clés et filtrer les mots vides
    const keywords = searchInput.split(/\s+/).filter(k => k.length > 0);
    
    // Vérifier si tous les mots-clés sont présents dans le label
    return keywords.every(keyword => label.includes(keyword));
  };

  // Fonction pour gérer l'ajout de plusieurs prestations à la fois
  const handleAddMultiplePrestations = (selectedPrestations: any[]) => {
    if (!currentSectionId) return;
    
    // Créer un tableau pour stocker les nouvelles prestations
    const newPrestations = selectedPrestations.map(prestation => {
      // Créer un nouvel ID unique pour la prestation
      const newPrestationId = Math.random().toString(36).substr(2, 9);
      
      // Vérifier si la prestation a des matériaux
      const materials = prestation.materials && Array.isArray(prestation.materials) 
        ? prestation.materials.map((material: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: material.name,
            quantity: material.quantity,
            price: material.price,
            unit: material.unit || 'u',
            reference: material.reference || '',
            tva: globalMaterialTVA,
            billable: false // Par défaut, le matériau n'est PAS facturable
          }))
        : [];
      
      // Créer la nouvelle prestation
      return {
        id: newPrestationId,
        name: prestation.name,
        quantity: prestation.quantity || 1,
        unit: prestation.unit || 'm²',
        unitPrice: prestation.price,
        tva: globalServiceTVA,
        amount: (prestation.price || 0) * (prestation.quantity || 1),
        description: prestation.description || '',
        category: { name: prestation.categoryName || 'Général' },
        materials: materials
      };
    });
    
    // Mettre à jour les sections
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === currentSectionId) {
          return {
            ...section,
            prestations: [...section.prestations, ...newPrestations]
          };
        }
        return section;
      });
    });
    
    // Fermer la modale
    setShowPrestationsSelector(false);
    setCurrentSectionId(null);
    
    // Réinitialiser le champ de recherche
    setPrestationSearchValue('');
  };

  // Fonction pour ouvrir la modale de sélection de catalogue et catégorie
  const openCatalogSelector = (sectionId: string) => {
    // Sauvegarder le texte de recherche actuel
    console.log('Texte de recherche actuel:', prestationSearchValue);
    setOriginalSearchText(prestationSearchValue);
    
    setCurrentSectionId(sectionId);
    setIsCatalogSelectorVisible(true);
  };

  return (
    <>
      <style jsx global>{`
        .ant-input-number-input {
          text-align: right !important;
        }
        .right-aligned-input .ant-input-number-input {
          text-align: right !important;
        }
      `}</style>
      
    <div className="container mx-auto py-10 pb-24">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {isEditMode ? `Modifier le Devis ${devisNumber?.reference}` : 'Nouveau Devis'}
          </h1>
          <div className="space-x-4">
            <Button onClick={() => router.push('/devis')}>
              Annuler
            </Button>
           
            <Button 
              type="primary"
              onClick={() => handleSaveDevis()}
              disabled={!selectedClient || sections.length === 0}
              loading={isLoading}
            >
              {isEditMode ? 'Enregistrer les modifications' : 'Créer le devis'}
            </Button>
          </div>
        </div>
        
        <Card className="mb-4">
          <Form layout="vertical">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Form.Item label="Numéro de devis">
                    <Input
                      value={devisNumber?.reference || ''}
                      disabled
                      placeholder="Numéro de devis"
                    />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Statut">
                    <Select
                      value={status}
                      onChange={(value) => setStatus(value)}
                      placeholder="Statut"
                    >
                      <Select.Option value="DRAFT">Brouillon</Select.Option>
                      <Select.Option value="SENT">Envoyé</Select.Option>
                      <Select.Option value="ACCEPTED">Accepté</Select.Option>
                      <Select.Option value="REJECTED">Refusé</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Type de projet">
                    <Select
                      value={projectType}
                      onChange={(value) => setProjectType(value)}
                      placeholder="Sélectionnez le type de projet"
                    >
                      {PROJECT_TYPES.map(type => (
                        <Select.Option key={type.value} value={type.value}>
                          {type.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item 
                    label="Client" 
                    required 
                    validateStatus={selectedClient ? 'success' : 'error'}
                  >
                    <Select
                      showSearch
                      value={selectedClient}
                      onChange={(value) => setSelectedClient(value)}
                      placeholder="Sélectionner un client"
                      aria-required="true"
                      loading={clientsLoading}
                      optionFilterProp="children"
                    >
                      {clients.map(client => (
                        <Select.Option key={client.id} value={client.id}>
                          {client.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item 
                    label="Catalogue" 
                    required
                    validateStatus={selectedCatalogId ? 'success' : 'error'}
                  >
                    <Select
                      value={selectedCatalogId}
                      onChange={(value) => setSelectedCatalogId(value)}
                      placeholder="Sélectionner un catalogue"
                      className="w-full"
                      options={catalogs.map(catalog => ({
                        value: catalog.id,
                        label: catalog.name
                      }))}
                    />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Prescripteur">
                    <Select
                      showSearch
                      value={devisNumber?.prescriberId}
                      onChange={(value) => {
                        setDevisNumber(prev => {
                          if (!prev) return prev;
        return {
                            ...prev,
                            prescriberId: value
                          };
                        });
                      }}
                      placeholder="Sélectionner un prescripteur"
                      loading={loadingPrescribers}
                    >
                      {prescribers.map(prescriber => (
                        <Select.Option key={prescriber.id} value={prescriber.id}>
                          {prescriber.nom}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="flex gap-4">
                  <Form.Item label="TVA Services" className="flex-1">
                    <Select
                      value={String(globalServiceTVA)}
                      onChange={(value) => setGlobalServiceTVA(Number(value))}
                      placeholder="TVA Services"
                    >
                      <Select.Option value="20">20%</Select.Option>
                      <Select.Option value="10">10%</Select.Option>
                      <Select.Option value="5.5">5.5%</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="TVA Matériaux" className="flex-1">
                    <Select
                      value={String(globalMaterialTVA)}
                      onChange={(value) => setGlobalMaterialTVA(Number(value))}
                      placeholder="TVA Matériaux"
                    >
                      <Select.Option value="20">20%</Select.Option>
                      <Select.Option value="10">10%</Select.Option>
                      <Select.Option value="5.5">5.5%</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Date d'expiration">
                    <Input
                      type="date"
                      value={expirationDate || ''}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      placeholder="Date d'expiration"
                    />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Mode de paiement">
                    <Select
                      value={paymentMethod}
                      onChange={(value) => setPaymentMethod(value)}
                      placeholder="Mode de paiement"
                    >
                      {Object.values(PAYMENT_METHODS).map(method => (
                        <Select.Option key={method} value={method}>
                          {method}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Pilote du projet">
                    <Input
                      value={pilot}
                      onChange={(e) => setPilot(e.target.value)}
                      placeholder="Nom du pilote du projet"
                    />
                  </Form.Item>
                </div>
              </div>
            </div>
          </Form>
        </Card>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Devis</h2>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => handleAddSection()}
            >
              Ajouter Section
            </button>
          </div>

          {sections.map((section, sectionIndex) => (
            <div key={`section-${section.id}-${sectionIndex}`} className="mb-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExpandedSections(
                        expandedSections.includes(section.id)
                          ? expandedSections.filter(id => id !== section.id)
                          : [...expandedSections, section.id]
                      );
                    }}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    {expandedSections.includes(section.id) ? <DownOutlined /> : <RightOutlined />}
                  </button>
                  <input
                    type="text"
                    value={section.name}
                    className="bg-transparent border-none font-semibold"
                    onChange={(e) => {
                      const newSections = sections.map(s =>
                        s.id === section.id ? { ...s, name: e.target.value } : s
                      );
                      setSections(newSections);
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span>Matériaux : {section.materialsTotal.toFixed(2)} €</span>
                  <span>Sous total : {section.subTotal.toFixed(2)} €</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setSectionToDelete(section.id);
                      setShowDeleteSectionModal(true);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {expandedSections.includes(section.id) && (
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="w-[30%]">Prestation</th>
                        <th className="w-[15%] text-right">Quantité</th>
                        <th className="w-[10%] text-right">Unité</th>
                        <th className="w-[15%] text-right">Prix unité</th>
                        <th className="w-[10%] text-right pr-[30px]">TVA</th>
                        <th className="w-[15%] text-right">Montant</th>
                        <th className="w-[5%]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.prestations.map((prestation, prestationIndex) => (
                        <React.Fragment key={`prestation-${prestation.id}-${prestationIndex}`}>
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="bg-white border rounded-lg mb-2">
                                <div className="p-4">
                                  <table className="w-full">
                                    <tbody>
                                      <tr>
                                        <td className="w-[30%]">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                setExpandedPrestations(
                                                  expandedPrestations.includes(prestation.id)
                                                    ? expandedPrestations.filter(id => id !== prestation.id)
                                                    : [...expandedPrestations, prestation.id]
                                                );
                                              }}
                                              className="text-gray-500 hover:text-blue-500"
                                            >
                                              {expandedPrestations.includes(prestation.id) ? <DownOutlined /> : <RightOutlined />}
                                            </button>
                                            {prestation.name}
                                          </div>
                                        </td>
                                        <td className="w-[15%]">
                                          <div className="flex justify-end">
                                              <InputNumber
                                                value={prestation.quantity}
                                                className="w-24 right-aligned-input"
                                                min={0}
                                                step={1.00}
                                                precision={2}
                                                formatter={(value) => `${value}`.replace('.', ',')}
                                                parser={(value) => {
                                                  const parsed = parseFloat((value || '0').replace(',', '.'));
                                                  return isNaN(parsed) ? 0 : parsed;
                                                }}
                                                onChange={(value) => handlePrestationQuantityChange(section.id, prestation.id, value || 0)}
                                              onWheel={(e) => e.currentTarget.blur()}
                                            />
                                          </div>
                                        </td>
                                        <td className="w-[10%]">
                                          <select className="border rounded p-1 w-full text-right">
                                            <option value="m²">m²</option>
                                            <option value="ml">ml</option>
                                            <option value="unité">unité</option>
                                          </select>
                                        </td>
                                        <td className="w-[15%]">
                                          <input
                                            type="number"
                                            value={prestation.unitPrice}
                                            className="w-full text-right border rounded p-1"
                                            onChange={(e) => {
                                              const value = parseFloat(e.target.value) || 0;
                                              handlePriceChange(section.id, prestation.id, value);
                                            }}
                                            min="0"
                                            step="1,00"
                                            onWheel={(e) => e.currentTarget.blur()}
                                          />
                                        </td>
                                        <td className="w-[10%]">
                                          <div className="flex justify-end w-full pr-[10px]">
                                            <select 
                                              className="w-20 border rounded p-1 text-right"
                                              value={prestation.tva}
                                              onChange={(e) => handleTVAChange(section.id, prestation.id, Number(e.target.value))}
                                            >
                                              <option value="20">20%</option>
                                              <option value="10">10%</option>
                                              <option value="5.5">5.5%</option>
                                            </select>
                                          </div>
                                        </td>
                                        <td className="w-[15%] text-right">{prestation.amount.toFixed(2)} €</td>
                                        <td className="w-[5%] text-center">
                                          <Dropdown
                                            menu={{
                                              items: [
                                                {
                                                  key: 'up',
                                                  label: 'Déplacer vers le haut',
                                                  icon: <ArrowUpOutlined />,
                                                  disabled: prestationIndex === 0,
                                                  onClick: () => handleMovePrestationUp(section.id, prestation.id)
                                                },
                                                {
                                                  key: 'down',
                                                  label: 'Déplacer vers le bas',
                                                  icon: <ArrowDownOutlined />,
                                                  disabled: prestationIndex === section.prestations.length - 1,
                                                  onClick: () => handleMovePrestationDown(section.id, prestation.id)
                                                },
                                                {
                                                  key: 'delete',
                                                  label: 'Supprimer',
                                                  icon: <DeleteOutlined />,
                                                  danger: true,
                                                  onClick: () => {
                                                    setMaterialToDelete({ 
                                                      sectionId: section.id, 
                                                      prestationId: prestation.id, 
                                                      materialId: prestation.id // ou une autre valeur appropriée
                                                    });
                                                    setShowDeleteMaterialModal(true);
                                                  }
                                                }
                                              ]
                                            }}
                                            trigger={['click']}
                                            placement="bottomRight"
                                          >
                                            <Button type="text" icon={<MoreOutlined />} className="text-gray-500 hover:text-blue-500" />
                                          </Dropdown>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>

                                {expandedPrestations.includes(prestation.id) && (
                                  <div className="border-t">
                                    <div className="bg-gray-50">
                                      <div className="py-2">
                                        <div 
                                          className="flex items-center gap-2 mb-2 cursor-pointer px-8"
                                          onClick={() => {
                                            setExpandedMaterials(
                                              expandedMaterials.includes(prestation.id)
                                                ? expandedMaterials.filter(id => id !== prestation.id)
                                                : [...expandedMaterials, prestation.id]
                                            );
                                          }}
                                        >
                                          {expandedMaterials.includes(prestation.id) ? <DownOutlined /> : <RightOutlined />}
                                          <h4 className="font-medium">Matériaux</h4>
                                          <span className="text-sm text-gray-500">
                                            ({prestation.materials.length} matériaux inclus)
                                          </span>
                                        </div>
                                        {expandedMaterials.includes(prestation.id) && (
                                          <div className="px-8">
                                            <table className="w-full text-sm bg-white border rounded">
                                              <thead>
                                                <tr className="border-b">
                                                  <th className="text-left p-2">Nom</th>
                                                  <th className="text-center p-2">Référence</th>
                                                  <th className="text-center p-2">Quantité</th>
                                                  <th className="text-center p-2">Unité</th>
                                                  <th className="text-right p-2">Prix unitaire</th>
                                                  <th className="text-center p-2">TVA</th>
                                                  <th className="text-center p-2">Facturer</th>
                                                  <th className="text-right p-2">Total</th>
                                                  <th className="w-10 p-2"></th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {prestation.materials.map((material, materialIndex) => {
                                                  console.log(`Rendu du matériau ${materialIndex}:`, material);
                                                  return (
                                                    <tr key={material.id} className="border-t">
                                                      <td className="p-2">
                                                        <Select
                                                          showSearch
                                                          value={material.name}
                                                          className="material-name"
                                                          placeholder="Rechercher un matériau..."
                                                          optionFilterProp="children"
                                                          title={material.name} // Ajouter cette ligne pour l'infobulle
                                                          onChange={(value) => {
                                                            const selectedProduct = availableMaterials.find(m => m.id === value);
                                                            if (selectedProduct) {
                                                              handleMaterialSelect(section.id, prestation.id, material.id, selectedProduct);
                                                            }
                                                          }}
                                                          filterOption={normalizedSearch}
                                                          options={availableMaterials.map(m => ({
                                                            value: m.id,
                                                            label: `${m.name} ${m.reference ? `(${m.reference})` : ''} - ${m.sellingPrice}€`
                                                          }))}
                                                        />
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <div className="flex justify-center">
                                                          <ReferenceInput
                                                            material={material}
                                                            sectionId={section.id}
                                                            prestationId={prestation.id}
                                                            onReferenceChange={handleMaterialReferenceChange}
                                                          />
                                                        </div>
                                                      </td>
                                                      <td className="text-center p-2">
                                                          <InputNumber
                                                            value={material.quantity}
                                                            className="w-24 right-aligned-input"
                                                            min={0}
                                                            step={1.00}
                                                            precision={2}
                                                            formatter={(value) => `${value}`.replace('.', ',')}
                                                            parser={(value) => {
                                                              const parsed = parseFloat((value || '0').replace(',', '.'));
                                                              return isNaN(parsed) ? 0 : parsed;
                                                            }}
                                                            onChange={(value) => handleMaterialQuantityChange(
                                                                section.id,
                                                                prestation.id,
                                                                material.id,
                                                              value || 0
                                                            )}
                                                          onWheel={(e) => e.currentTarget.blur()}
                                                            style={{ textAlign: 'right' }}
                                                        />
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <select
                                                          value={material.unit}
                                                          className="w-20 border rounded p-1"
                                                          onChange={(e) => handleMaterialUnitChange(section.id, prestation.id, material.id, e.target.value)}
                                                        >
                                                          <option value="u">u</option>
                                                          <option value="m²">m²</option>
                                                          <option value="ml">ml</option>
                                                        </select>
                                                      </td>
                                                      <td className="text-right p-2">
                                                        <div className="flex justify-end items-center">
                                                          <input
                                                            type="number"
                                                            value={material.price}
                                                            className="w-24 text-right border rounded p-1"
                                                            onChange={(e) => {
                                                              const value = parseFloat(e.target.value) || 0;
                                                              handleMaterialPriceChange(
                                                                section.id,
                                                                prestation.id,
                                                                material.id,
                                                                value
                                                              );
                                                            }}
                                                            min="0"
                                                            step="1.00"
                                                            onWheel={(e) => e.currentTarget.blur()}
                                                          />
                                                          <span className="ml-1">€</span>
                                                        </div>
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <select
                                                          value={material.tva}
                                                          className="w-20 border rounded p-1"
                                                          onChange={(e) => handleMaterialTVAChange(section.id, prestation.id, material.id, Number(e.target.value))}
                                                        >
                                                          <option value="20">20%</option>
                                                          <option value="10">10%</option>
                                                          <option value="5.5">5.5%</option>
                                                        </select>
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <div className="flex items-center justify-center">
                                                          <input
                                                            type="checkbox"
                                                            checked={material.billable !== false}
                                                            onChange={(e) => {
                                                              handleMaterialBillableChange(
                                                                section.id,
                                                                prestation.id,
                                                                material.id,
                                                                e.target.checked
                                                              );
                                                            }}
                                                          />
                                                          <DollarOutlined style={{ color: material.billable !== false ? '#1890ff' : '#d9d9d9', marginLeft: '5px' }} />
                                                        </div>
                                                      </td>
                                                      <td className="text-right p-2">
                                                        {material.billable !== false ? (material.quantity * material.price).toFixed(2) : "0.00"} €
                                                      </td>
                                                      <td className="text-center p-2">
                                                        <button 
                                                          className="text-red-500 hover:text-red-700"
                                                          onClick={() => {
                                                            setMaterialToDelete({ 
                                                              sectionId: section.id, 
                                                              prestationId: prestation.id, 
                                                              materialId: prestation.id // ou une autre valeur appropriée
                                                            });
                                                            setShowDeleteMaterialModal(true);
                                                          }}
                                                        >
                                                          🗑️
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                                <tr>
                                                  <td colSpan={6} className="pt-4">
                                                    <div className="flex items-center gap-2 bg-white border rounded p-2">
                                                      <span className="text-blue-600 text-xl">+</span>
                                                      <Select
                                                        showSearch
                                                        className="material-select flex-grow"
                                                        value={materialSearchValue}
                                                        style={{ width: '100%' }}
                                                        placeholder="Ajouter un matériau..."
                                                        suffixIcon={<span className="text-gray-400">▼</span>}
                                                        variant="borderless"
                                                        options={availableMaterials.map(material => ({
                                                          label: `${material.name} - ${material.sellingPrice}€ ${material.unit || 'unité'}`,
                                                          value: material.id
                                                        }))}
                                                        onChange={(value) => {
                                                          handleAddMaterial(section.id, prestation.id, value);
                                                        }}
                                                        filterOption={normalizedSearch}
                                                        notFoundContent={isLoading ? <Spin size="small" /> : "Aucun matériau trouvé"}
                                                      />
                                                    </div>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="bg-gray-50 border-t">
                                      <div className="py-2">
                                        <div 
                                          className="flex items-center gap-2 mb-2 px-8"
                                        >
                                          <div 
                                            className="flex items-center gap-2 cursor-pointer"
                                            onClick={() => {
                                              setExpandedDescriptions(
                                                expandedDescriptions.includes(prestation.id)
                                                  ? expandedDescriptions.filter(id => id !== prestation.id)
                                                  : [...expandedDescriptions, prestation.id]
                                              );
                                            }}
                                          >
                                            {expandedDescriptions.includes(prestation.id) ? <DownOutlined /> : <RightOutlined />}
                                            <h4 className="font-medium">Description et conditions</h4>
                                          </div>
                                          <Checkbox 
                                            checked={showDescriptions} 
                                            onChange={(e) => setShowDescriptions(e.target.checked)}
                                          />
                                          <span className="text-sm text-gray-500">Afficher dans le devis</span>
                                        </div>
                                        {expandedDescriptions.includes(prestation.id) && (
                                          <div className="px-8">
                                            <div className="mb-4">
                                              <h4 className="font-medium mb-1">Description</h4>
                                              <textarea
                                                placeholder="Description détaillée de la prestation..."
                                                className="w-full p-2 border rounded bg-white"
                                                rows={3}
                                                value={prestation.description || ''}
                                                onChange={(e) => {/* TODO: Gérer le changement */}}
                                              />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <h4 className="font-medium mb-1">Notes</h4>
                                                <textarea
                                                  placeholder="Notes supplémentaires..."
                                                  className="w-full p-2 border rounded bg-white"
                                                  rows={2}
                                                  value={prestation.notes || ''}
                                                  onChange={(e) => {/* TODO: Gérer le changement */}}
                                                />
                                              </div>
                                              <div>
                                                <h4 className="font-medium mb-1">Conditions</h4>
                                                <textarea
                                                  placeholder="Conditions particulières..."
                                                  className="w-full p-2 border rounded bg-white"
                                                  rows={2}
                                                  value={prestation.conditions || ''}
                                                  onChange={(e) => {/* TODO: Gérer le changement */}}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr>
                        <td colSpan={7} className="pt-4">
                          <div className="flex items-center gap-2 bg-white border rounded p-2">
                            <span className="text-blue-600 text-xl">+</span>
                            <Select
                              showSearch
                              className="prestation-select flex-grow"
                              value={prestationSearchValue}
                              style={{ width: '100%' }}
                              placeholder="Ajouter une prestation..."
                              suffixIcon={<span className="text-gray-400">▼</span>}
                              variant="borderless"
                              options={prestations.filter(p => p && p.id).map(prestation => ({
                                label: `${prestation.categoryName || 'Général'} - ${prestation.name} - ${prestation.price}€`,
                                value: prestation.id
                              }))}
                              onChange={(value) => {
                                handleAddPrestation(section.id, value);
                                setPrestationSearchValue('');
                              }}
                              onSearch={(value) => {
                                // Mettre à jour la valeur de recherche
                                setPrestationSearchValue(value);
                                
                                // Utiliser un debounce pour éviter d'appeler handleSearch trop souvent
                                if (searchTimeoutRef.current) {
                                  clearTimeout(searchTimeoutRef.current);
                                }
                                
                                searchTimeoutRef.current = setTimeout(() => {
                                  console.log('Recherche dans Select (debounced):', value);
                                  handleSearch(value);
                                }, 300); // Attendre 300ms avant d'appeler handleSearch
                              }}
                              filterOption={(input, option) => {
                                if (!option || !option.label) return false;
                                return option.label.toLowerCase().includes(input.toLowerCase());
                              }}
                              notFoundContent={
                                isLoading ? 
                                <Spin size="small" /> : 
                                <div style={{ padding: '8px', textAlign: 'center' }}>
                                  <div>Aucune prestation trouvée</div>
                                </div>
                              }
                              dropdownRender={(menu) => (
                                <div>
                                  {menu}
                                  {/* Afficher un seul lien pour créer une prestation */}
                                  <div style={{ padding: '8px', borderTop: prestations.length > 0 ? '1px solid #f0f0f0' : 'none' }}>
                                    <Button 
                                      type="link"
                                      onClick={() => {
                                        console.log('Ouverture de la modale de sélection de catalogue');
                                        openCatalogSelector(section.id);
                                      }}
                                      style={{ width: '100%', textAlign: 'center' }}
                                      icon={<PlusOutlined />}
                                    >
                                      {prestationSearchValue && prestationSearchValue.length > 0 
                                        ? `Créer "${prestationSearchValue}"` 
                                        : "Créer une nouvelle prestation"}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            />
                            <Button 
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setCurrentSectionId(section.id);
                                setShowPrestationsSelector(true);
                              }}
                              title="Sélectionner plusieurs prestations"
                            >
                              Sélection multiple
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Composant de sélection des prestations */}
        <PrestationsSelector
          visible={showPrestationsSelector}
          onCancel={() => setShowPrestationsSelector(false)}
          onAdd={handleAddMultiplePrestations}
          catalogId={selectedCatalogId}
          loading={isLoading}
        />

    

        {/* Bloc des commentaires */}
        <Card 
          className="mt-4 mb-4"
          title={
            <div className="flex items-center">
              <Button 
                type="text" 
                icon={commentsCollapsed ? <RightOutlined /> : <DownOutlined />}
                onClick={() => setCommentsCollapsed(!commentsCollapsed)}
              />
              <span>Commentaires</span>
            </div>
          }
          type="inner"
        >
          {!commentsCollapsed && (
            <>
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Checkbox 
                    checked={showDevisComments} 
                    onChange={(e) => setShowDevisComments(e.target.checked)}
                  />
                  <span className="ml-2 font-medium">Afficher les commentaires du devis</span>
                </div>
                <Input.TextArea
                  rows={4}
                  value={devisComments}
                  onChange={(e) => setDevisComments(e.target.value)}
                  placeholder="Commentaires à afficher sur le devis (après le mode de paiement)"
                  disabled={false}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <Checkbox 
                    checked={showOrderFormComments} 
                    onChange={(e) => setShowOrderFormComments(e.target.checked)}
                  />
                  <span className="ml-2 font-medium">Afficher les commentaires du bon de commande</span>
                </div>
                <Input.TextArea
                  rows={4}
                  value={orderFormComments}
                  onChange={(e) => setOrderFormComments(e.target.value)}
                  placeholder="Commentaires à afficher sur le bon de commande (après la dernière ligne)"
                  disabled={false}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                />
              </div>
            </>
          )}
        </Card>



        <Card className="p-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-right">Totaux</h3>
            <div className="flex flex-col gap-2">
              {totals.services.tvaDetails.map(({ taux, tva }) => (
                <div key={`service-tva-${taux}`} className="flex justify-end gap-8">
                  <div>TVA Services ({taux}%)</div>
                  <div className="w-32 text-right">{tva.toFixed(2)} €</div>
                </div>
              ))}

              {totals.materials.tvaDetails.map(({ taux, tva }) => (
                <div key={`material-tva-${taux}`} className="flex justify-end gap-8">
                  <div>TVA Matériaux ({taux}%)</div>
                  <div className="w-32 text-right">{tva.toFixed(2)} €</div>
                </div>
              ))}

              <div className="flex justify-end gap-8 mt-4 pt-2 border-t">
                <div>Total HT</div>
                <div className="w-32 text-right">{totals.totalHT.toFixed(2)} €</div>
              </div>
              <div className="flex justify-end gap-8">
                <div>Total TVA</div>
                <div className="w-32 text-right">{totals.totalTVA.toFixed(2)} €</div>
              </div>
              <div className="flex justify-end gap-8 font-bold">
                <div>Total TTC</div>
                <div className="w-32 text-right">{totals.totalTTC.toFixed(2)} €</div>
              </div>
            </div>
          </div>
        </Card>

        {renderTotalsFooter()}

        {/* Modal pour l'aperçu du devis simple */}
        <Modal
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Aperçu du devis simple</span>
                <PDFDownloadLink
                  document={
                    <DevisPDF
                      devisNumber={devisNumber?.reference || ''}
                      expirationDate={expirationDate || undefined}
                      paymentMethod={paymentMethod || undefined}
                      pilot={pilot}
                      sections={sections}
                      totals={totals}
                      contact={getContactInfo()}
                      company={companyInfo}
                      showMaterials={false}
                      devisComments={devisComments}
                      showDevisComments={showDevisComments}
                      showDescriptions={showDescriptions}
                    />
                  }
                  fileName={`devis-simple-${devisNumber?.reference || 'nouveau'}.pdf`}
                >
                  {({ loading, error }) => (
                    <Button 
                      type="primary"
                      icon={<PrinterOutlined />}
                      disabled={loading}
                      size="small"
                    >
                      {loading ? 'Génération...' : error ? 'Erreur' : 'Télécharger'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          }
          open={showSimpleDevisPreview}
          onCancel={() => setShowSimpleDevisPreview(false)}
          width="80%"
          footer={null}
        >
          <div style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="800px">
              <DevisPDF 
                devisNumber={devisNumber?.reference || ''}
                expirationDate={expirationDate || undefined}
                paymentMethod={paymentMethod || undefined}
                pilot={pilot}
                sections={sections}
                totals={totals}
                contact={getContactInfo()}
                company={companyInfo}
                showMaterials={false}
                devisComments={devisComments}
                showDevisComments={showDevisComments}
                showDescriptions={showDescriptions}
              />
            </PDFViewer>
          </div>
        </Modal>

        {/* Modal pour l'aperçu du devis détaillé */}
        <Modal
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Aperçu du devis détaillé</span>
                <PDFDownloadLink
                  document={
                    <DevisWithMaterialsPDF
                      devisNumber={devisNumber?.reference || ''}
                      expirationDate={expirationDate || undefined}
                      paymentMethod={paymentMethod || undefined}
                      pilot={pilot}
                      sections={sections}
                      totals={totals}
                      contact={getContactInfo()}
                      company={companyInfo}
                      devisComments={devisComments}
                      showDevisComments={showDevisComments}
                    />
                  }
                  fileName={`devis-detaille-${devisNumber?.reference || 'nouveau'}.pdf`}
                >
                  {({ loading, error }) => (
                    <Button 
                      type="primary"
                      icon={<PrinterOutlined />}
                      disabled={loading}
                      size="small"
                    >
                      {loading ? 'Génération...' : error ? 'Erreur' : 'Télécharger'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          }
          open={showDevisWithMaterialsPreview}
          onCancel={() => setShowDevisWithMaterialsPreview(false)}
          width="80%"
          footer={null}
        >
          <div style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="800px">
              <DevisWithMaterialsPDF 
                devisNumber={devisNumber?.reference || ''}
                expirationDate={expirationDate || undefined}
                paymentMethod={paymentMethod || undefined}
                pilot={pilot}
                sections={sections}
                totals={totals}
                contact={getContactInfo()}
                company={companyInfo}
                devisComments={devisComments}
                showDevisComments={showDevisComments}
              />
            </PDFViewer>
          </div>
        </Modal>

        {/* Modal pour l'aperçu du bon de commande */}
        <Modal
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Aperçu du bon de commande</span>
                <PDFDownloadLink
                  document={
                    <OrderFormPDF
                      sections={sections}
                      contact={getContactInfo()}
                      company={companyInfo}
                      orderFormComments={orderFormComments}
                      showOrderFormComments={showOrderFormComments}
                      devisReference={devisNumber?.reference}
                    />
                  }
                  fileName={`bon-commande.pdf`}
                >
                  {({ loading, error }) => (
                    <Button 
                      type="primary"
                      icon={<PrinterOutlined />}
                      disabled={loading}
                      size="small"
                    >
                      {loading ? 'Génération...' : error ? 'Erreur' : 'Télécharger'}
                    </Button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          }
          open={showOrderFormPreview}
          onCancel={() => setShowOrderFormPreview(false)}
          width="80%"
          footer={null}
        >
          <div style={{ height: '80vh' }}>
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <OrderFormPDF 
                sections={sections}
                contact={getContactInfo()}
                company={companyInfo}
                orderFormComments={orderFormComments}
                showOrderFormComments={showOrderFormComments}
                devisReference={devisNumber?.reference}
              />
            </PDFViewer>
          </div>
        </Modal>

        <Modal
          title="Confirmer la suppression"
          open={showDeleteSectionModal}
          onCancel={() => {
            setShowDeleteSectionModal(false);
            setSectionToDelete(null);
          }}
          onOk={() => {
            if (sectionToDelete) {
              handleDeleteSection(sectionToDelete);
            }
            setShowDeleteSectionModal(false);
          }}
          okText="Supprimer"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <p>Êtes-vous sûr de vouloir supprimer cette section et toutes ses prestations ?</p>
        </Modal>

        <Modal
          title="Confirmer la suppression"
          open={showDeletePrestationModal}
          onCancel={() => {
            setShowDeletePrestationModal(false);
            setPrestationToDelete(null);
          }}
          onOk={() => {
            if (prestationToDelete) {
              handleDeletePrestation(prestationToDelete.sectionId, prestationToDelete.prestationId);
            }
            setShowDeletePrestationModal(false);
          }}
          okText="Supprimer"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <p>Êtes-vous sûr de vouloir supprimer cette prestation et tous ses matériaux ?</p>
        </Modal>

        <Modal
          title="Confirmer la suppression"
          open={showDeleteMaterialModal}
          onCancel={() => {
            setShowDeleteMaterialModal(false);
            setMaterialToDelete(null);
          }}
          onOk={() => {
            if (materialToDelete) {
              handleDeleteMaterial(
                materialToDelete.sectionId,
                materialToDelete.prestationId,
                materialToDelete.materialId
              );
            }
            setShowDeleteMaterialModal(false);
          }}
          okText="Supprimer"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <p>Êtes-vous sûr de vouloir supprimer ce matériau ?</p>
        </Modal>

        {/* Modale pour créer une nouvelle prestation */}
        <Modal
          title="Nouvelle Prestation"
          open={isServiceCreatorVisible}
          onCancel={() => setIsServiceCreatorVisible(false)}
          footer={null}
          width={800}
          destroyOnClose={true}
        >
          <div style={{ position: 'relative', minHeight: '300px' }}>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  Chargement des produits en cours...
                </div>
                <Spin size="large" />
              </div>
            ) : (
            <ServiceForm
              categoryId={selectedCategoryForService || ''}
              products={products}
                onSubmit={async (values) => {
                console.log('Nouvelle prestation créée:', values);
                console.log('Matériaux de la prestation:', values.materials);
                
                  try {
                    // 1. Enregistrer la prestation comme un produit de type SERVICE
                    const serviceData = {
                      name: values.name,
                      description: values.description || '',
                      unit: values.unit || 'm²', // Utiliser la valeur du formulaire si disponible
                      cost: values.price * 0.7, // Coût estimé à 70% du prix de vente
                      sellingPrice: values.price,
                      category: 'SERVICE',
                      reference: `${catalogCategories.find(cat => cat.id === selectedCategoryForService)?.name || ''}-${values.name}`
                    };
                    
                    console.log('Enregistrement de la prestation comme produit:', serviceData);
                    const serviceResponse = await fetch('/api/products', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(serviceData),
                    });
                    
                    if (!serviceResponse.ok) {
                      throw new Error('Erreur lors de l\'enregistrement de la prestation');
                    }
                    
                    const savedService = await serviceResponse.json();
                    console.log('Prestation enregistrée avec succès:', savedService);
                    
                    // 2. Si la prestation a des matériaux, les enregistrer également
                    const savedMaterials: Array<typeof products[0]> = [];
                    for (const material of values.materials) {
                      // Vérifier si le matériau existe déjà (s'il a un ID valide)
                      if (material.productId) {
                        // Chercher le matériau dans la liste des produits
                        const existingProduct = products.find(p => p.id === material.productId);
                        if (existingProduct) {
                          savedMaterials.push(existingProduct);
                        } else {
                          // Le matériau n'existe pas dans la liste des produits, il a peut-être été créé récemment
                          console.log('Matériau non trouvé dans la liste des produits:', material.productId);
                          
                          // Charger le matériau depuis l'API
                          try {
                            const materialResponse = await fetch(`/api/products/${material.productId}`);
                            if (materialResponse.ok) {
                              const loadedMaterial = await materialResponse.json();
                              console.log('Matériau chargé depuis l\'API:', loadedMaterial);
                              savedMaterials.push(loadedMaterial);
                              
                              // Ajouter le matériau à la liste des produits
                              setProducts(prevProducts => [...prevProducts, loadedMaterial]);
                            } else {
                              console.error('Erreur lors du chargement du matériau:', materialResponse.statusText);
                            }
                          } catch (error) {
                            console.error('Erreur lors du chargement du matériau:', error);
                          }
                        }
                      }
                    }
                    
                    // 3. Ajouter la prestation au catalogue sélectionné
                    if (selectedCatalogId && selectedCategoryForService) {
                      try {
                        // Créer un service dans la catégorie sélectionnée
                        const catalogServiceData = {
                          name: values.name,
                          description: values.description || '',
                          price: values.price,
                          unit: values.unit || 'm²', // Utiliser la valeur du formulaire si disponible
                          categoryId: selectedCategoryForService,
                          materials: values.materials
                            .filter(material => material.productId && material.quantity > 0)
                            .map(material => {
                              const product = products.find(p => p.id === material.productId);
                              if (!product) {
                                console.warn(`Produit non trouvé pour le matériau avec ID ${material.productId}`);
                                return null;
                              }
                              
                              // Créer un objet matériau complet avec toutes les propriétés nécessaires
                              const materialData = {
                                productId: material.productId,
                                quantity: material.quantity,
                                name: product.name,
                                price: product.sellingPrice,
                                unit: product.unit || 'u',
                              };
                              
                              console.log('Matériau préparé pour l\'API:', materialData);
                              return materialData;
                            })
                            .filter(Boolean) // Filtrer les valeurs null
                        };
                        
                        console.log('Ajout de la prestation au catalogue:', catalogServiceData);
                        console.log('Nombre de matériaux à ajouter:', catalogServiceData.materials.length);
                        console.log('Matériaux à ajouter:', JSON.stringify(catalogServiceData.materials));
                        
                        const catalogResponse = await fetch(`/api/catalogs/${selectedCatalogId}/categories/${selectedCategoryForService}/services`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(catalogServiceData),
                        });
                        
                        if (!catalogResponse.ok) {
                          const errorText = await catalogResponse.text();
                          console.warn('Erreur lors de l\'ajout de la prestation au catalogue:', errorText);
                          throw new Error(`Erreur lors de l'ajout de la prestation au catalogue: ${errorText}`);
                        } else {
                          const catalogResult = await catalogResponse.json();
                          console.log('Prestation ajoutée au catalogue avec succès:', catalogResult);
                          
                          // Vérifier si les matériaux ont été correctement ajoutés
                          if (catalogResult.materials && Array.isArray(catalogResult.materials)) {
                            console.log(`${catalogResult.materials.length} matériaux ajoutés au service dans le catalogue`);
                            console.log('Matériaux ajoutés:', catalogResult.materials);
                            
                            if (catalogResult.materials.length !== catalogServiceData.materials.length) {
                              console.warn(`Attention: ${catalogServiceData.materials.length - catalogResult.materials.length} matériaux n'ont pas été ajoutés au service`);
                            }
                          } else {
                            console.warn('Aucun matériau n\'a été ajouté au service dans le catalogue');
                          }
                          
                          // Recharger les prestations du catalogue pour mettre à jour l'interface
                          if (selectedCatalogId) {
                            try {
                              const refreshResponse = await fetch(`/api/catalogs/${selectedCatalogId}`);
                              if (refreshResponse.ok) {
                                const refreshData = await refreshResponse.json();
                                if (refreshData.categories) {
                                  const refreshedPrestations = refreshData.categories.flatMap((category: any) => 
                                    category.services.map((service: any) => ({
                                      id: service.id,
                                      name: service.name,
                                      description: service.description,
                                      price: service.price,
                                      quantity: service.quantity || 1,
                                      unit: service.unit || 'm²',
                                      materials: service.materials || [],
                                      categoryName: category.name,
                                      categoryId: category.id
                                    }))
                                  );
                                  console.log('Prestations rechargées après ajout:', refreshedPrestations.length);
                                  setPrestations(refreshedPrestations);
                                }
                              }
                            } catch (refreshError) {
                              console.error('Erreur lors du rechargement des prestations:', refreshError);
                            }
                          }
                        }
                      } catch (catalogError) {
                        console.error('Erreur lors de l\'ajout de la prestation au catalogue:', catalogError);
                      }
                    }
                    
                    // 4. Créer l'objet newService pour handleServiceCreated
                const newService = {
                      id: savedService.id || Math.random().toString(36).substr(2, 9),
                  name: values.name,
                  description: values.description,
                  price: values.price,
                      unit: values.unit || 'm²', // Ajouter explicitement le champ unit
                      categoryName: catalogCategories.find(cat => cat.id === selectedCategoryForService)?.name || 'Nouvelle prestation',
                  materials: values.materials.map(material => {
                    const product = products.find(p => p.id === material.productId);
                    if (!product) {
                      console.warn(`Produit non trouvé pour le matériau avec ID ${material.productId}`);
                      // Rechercher dans les matériaux sauvegardés
                      const savedMaterial = savedMaterials.find(m => m.id === material.productId);
                      if (savedMaterial) {
                        return {
                          id: savedMaterial.id,
                          name: savedMaterial.name,
                          quantity: material.quantity || 1,
                          price: savedMaterial.sellingPrice || 0,
                          unit: savedMaterial.unit || 'u',
                          reference: savedMaterial.reference || '',
                        };
                      }
                    }
                    return {
                      id: material.productId,
                      name: product?.name || 'Matériau',
                      quantity: material.quantity || 1,
                      price: product?.sellingPrice || 0,
                      unit: product?.unit || 'u',
                      reference: product?.reference || '',
                    };
                  })
                };
                
                    // 5. Ajouter la prestation au devis
                handleServiceCreated(newService);
                    
                    // 6. Mettre à jour la liste des produits disponibles
                    const updatedProduct = {
                      id: savedService.id,
                      name: values.name,
                      description: values.description || null,
                      unit: values.unit || '',
                      cost: values.price * 0.7,
                      sellingPrice: values.price,
                      category: 'SERVICE',
                      reference: `${catalogCategories.find(cat => cat.id === selectedCategoryForService)?.name || ''}-${values.name}`,
                      createdAt: new Date(),
                      updatedAt: new Date()
                    };
                    setProducts(prevProducts => [...prevProducts, updatedProduct]);
                    
                    // 7. Afficher un message de succès
                    message.success('Prestation créée et ajoutée avec succès');
                    
                  } catch (error) {
                    console.error('Erreur lors de la création de la prestation:', error);
                    message.error('Erreur lors de la création de la prestation');
                  }
              }}
              isLoading={false}
              onCloseParentModal={() => setIsServiceCreatorVisible(false)}
              onUpdateProduct={async (product) => {
                  // Convertir le produit au format attendu par setProducts
                  const convertProduct = (p: any) => ({
                    ...p,
                    description: p.description || null,
                    reference: p.reference || null,
                    unit: p.unit !== undefined ? p.unit : null,
                    category: p.category || 'MATERIAL'
                  });
                  
                  const convertedProduct = convertProduct(product);
                  
                // Mettre à jour le produit dans la liste des produits
                const updatedProducts = products.map(p => 
                    p.id === product.id ? convertedProduct : p
                );
                setProducts(updatedProducts);
                return product;
              }}
                initialValues={{ 
                  name: prestationSearchValue,
                  price: 0,
                  quantity: 1,
                  materials: []
                }} // Passer le texte recherché comme valeur initiale
              />
            )}
          </div>
        </Modal>

        {/* Modale pour sélectionner un catalogue et une catégorie */}
        <Modal
          title="Sélection du catalogue et de la catégorie"
          open={isCatalogSelectorVisible}
          onCancel={() => {
            setIsCatalogSelectorVisible(false);
            setIsCreatingCategory(false);
          }}
          footer={null}
          width={600}
        >
          <div style={{ position: 'relative', minHeight: '300px' }}>
            <div className="catalog-selector" style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>Étape 1: Sélectionnez un catalogue</div>
              <Select
                style={{ width: '100%', marginBottom: '16px' }}
                placeholder="Sélectionner un catalogue"
                value={selectedCatalogId}
                onChange={(value) => {
                  handleCatalogChange(value);
                }}
                options={catalogs.map(catalog => ({
                  value: catalog.id,
                  label: catalog.name
                }))}
                disabled={catalogs.length === 0 || isLoading}
              />
              
              {isLoading && <div style={{ textAlign: 'center', margin: '10px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: '10px', color: '#1890ff' }}>
                  Chargement des catégories en cours...
                </div>
              </div>}
              
              {isCreatingCategory && !isCategoryCreatorVisible && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '10px', color: '#1890ff' }}>
                    Création de la catégorie en cours...
                  </div>
                </div>
              )}
              
              {selectedCatalogId && !isLoading && !isCreatingCategory && (
                <>
                  <div style={{ marginBottom: '8px' }}>
                    Étape 2: Sélectionnez une catégorie
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<ReloadOutlined spin={isReloadingCategories} />}
                      onClick={() => loadCatalogCategories(selectedCatalogId)}
                      style={{ marginLeft: '8px' }}
                      title="Recharger les catégories"
                      disabled={isReloadingCategories}
                    />
                  </div>
                  {catalogCategories && catalogCategories.length > 0 ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Select
                          style={{ flex: 1 }}
                  placeholder="Sélectionner une catégorie"
                          value={selectedCategoryForService}
                  onChange={(value) => setSelectedCategoryForService(value)}
                  options={catalogCategories.map(category => ({
                    value: category.id,
                    label: category.name
                  }))}
                          disabled={catalogCategories.length === 0}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => 
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setIsCategoryCreatorVisible(true);
                            setIsCreatingCategory(true);
                          }}
                        >
                          Créer
                        </Button>
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', textAlign: 'right' }}>
                        {catalogCategories.length} catégorie(s) disponible(s)
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', margin: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, padding: '8px', border: '1px dashed #d9d9d9', borderRadius: '4px', color: '#999', textAlign: 'center' }}>
                          Aucune catégorie disponible
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setIsCategoryCreatorVisible(true);
                            setIsCreatingCategory(true);
                          }}
                        >
                          Créer
                        </Button>
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        État de catalogCategories: {JSON.stringify(catalogCategories)}
                      </div>
                      <Button 
                        type="default" 
                        icon={<ReloadOutlined spin={isReloadingCategories} />}
                        onClick={() => loadCatalogCategories(selectedCatalogId)}
                        style={{ marginTop: '10px' }}
                        disabled={isReloadingCategories}
                      >
                        Réessayer
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsCatalogSelectorVisible(false)} style={{ marginRight: '8px' }}>
                Annuler
              </Button>
              <Button 
                type="primary" 
                onClick={() => {
                  if (selectedCategoryForService) {
                    continueToServiceCreation(selectedCategoryForService);
                  } else {
                    message.error('Veuillez sélectionner une catégorie');
                  }
                }}
                disabled={!selectedCategoryForService}
              >
                Continuer
              </Button>
            </div>
          </div>
        </Modal>

       

        {/* Modale pour créer une catégorie */}
        <CategoryCreator
          visible={isCategoryCreatorVisible}
          onCancel={() => {
            setIsCategoryCreatorVisible(false);
            setIsCreatingCategory(false);
          }}
          onSuccess={handleCategoryCreated}
          catalogId={selectedCatalogId || ''}
        />

       

        {/* Remplacer le footer fixe par le nouveau composant */}
      </div>
    </div>
    </>
  );
}


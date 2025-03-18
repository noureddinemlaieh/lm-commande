'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Select, Spin, Form, Card, Button, Modal, Input, Checkbox, Tooltip, Dropdown } from 'antd';
import type { SelectProps } from 'antd';
import { getNextDevisNumber } from '@/utils/devisSequence';
import { Catalog } from '@/types/Catalog';
import React from 'react';
import { DownOutlined, RightOutlined, EyeOutlined, PrinterOutlined, FileTextOutlined, DollarOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { Client } from '@/types/Client';
import { message } from 'antd';
import { useRouter } from 'next/navigation';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { DevisPDF } from '@/components/DevisPDF';
import { InputNumber } from 'antd';
import './styles.css';
import { OrderFormPDF } from '@/components/OrderFormPDF';
import { pdf } from '@react-pdf/renderer';
import { DevisWithMaterialsPDF } from '@/components/DevisWithMaterialsPDF';
import { PAYMENT_METHODS } from '@/types/payment';
import type { CatalogService } from '@/types/Catalog';
import { CreateInvoiceFromDevis } from '@/components/CreateInvoiceFromDevis';
import PrestationsSelector from '@/components/PrestationsSelector';
import { PROJECT_TYPES } from '@/constants/projectTypes';
import ServiceCreator from '@/components/catalogs/ServiceCreator';
import ServiceForm from '@/components/catalogs/ServiceForm';

interface Prestation {
  id: string;
  nom: string;
  reference: string;
  prix: number;
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

interface DevisNumber {
  number: number;
  year: number;
  reference: string;
  status: string;
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
    category?: { name: string } | string;
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
  category: { name: string } | string;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  unit: string;
  category: string;
  reference?: string;
}

interface ExtendedService extends CatalogService {
  categoryName?: string;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  services: Array<CatalogService>;
}

// Ajouter les interfaces pour les données reçues de l'API
interface DevisService {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: string;
  tva: number;
  materials: DevisMaterial[];
}

interface DevisMaterial {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
  reference?: string;
  tva: number;
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
  clientId: string;
  catalogId: string;
  sections: DevisSection[];
  expirationDate?: string;
  paymentMethod?: string;
  devisComments?: string;
  showDevisComments?: boolean;
  orderFormComments?: string;
  showOrderFormComments?: boolean;
  showDescriptions?: boolean;
  projectType?: string;
}

// Ajouter l'interface Totals si elle n'existe pas déjà
interface Totals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  services: {
    totalHT: number;
    tvaDetails: Array<{ taux: number; ht: number; tva: number; }>;
  };
  materials: {
    totalHT: number;
    tvaDetails: Array<{ taux: number; ht: number; tva: number; }>;
  };
}

// Ajouter les informations de l'entreprise
const companyInfo = {
  name: "Votre Entreprise",
  address: "123 Rue du Commerce, 75001 Paris",
  logo: "/images/logo.png", // Assurez-vous d'avoir un logo dans le dossier public
  legalInfo: "SIRET: 123 456 789 00001 - TVA: FR12345678900"
};

interface CatalogData {
  id: string;
  categories: Array<{
    id: string;
    name: string;
    services: Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      materials: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        unit: string;
        reference?: string;
      }>;
    }>;
  }>;
}

const DEVIS_STATUSES = {
  DRAFT: { label: 'Brouillon', color: 'gray' },
  SENT: { label: 'Envoyé', color: 'blue' },
  ACCEPTED: { label: 'Accepté', color: 'green' },
  REJECTED: { label: 'Refusé', color: 'red' }
};

interface FormData {
  prescripteur: string;
}

const generateFileName = (contact?: Client) => {
  const clientName = contact?.name || 'CLIENT';
  return `${clientName.toUpperCase()} - BON DE COMMANDE.pdf`;
};

// Modifier l'interface Service pour correspondre à la structure réelle
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  materials: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
    reference?: string;
  }>;
}

export default function EditDevisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState(false);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [devisNumber, setDevisNumber] = useState<DevisNumber | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [prestations, setPrestations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogServices, setCatalogServices] = useState<ExtendedService[]>([]);
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
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [devisComments, setDevisComments] = useState<string>('');
  const [showDevisComments, setShowDevisComments] = useState<boolean>(true);
  const [orderFormComments, setOrderFormComments] = useState<string>('');
  const [showOrderFormComments, setShowOrderFormComments] = useState<boolean>(true);
  const [showDescriptions, setShowDescriptions] = useState<boolean>(false);
  const [showPrestationsSelector, setShowPrestationsSelector] = useState<boolean>(false);
  const [selectedPrestations, setSelectedPrestations] = useState<any[]>([]);
  const [projectType, setProjectType] = useState<string>('AUTRE');
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedPrestations, setExpandedPrestations] = useState<string[]>([]);
  const [expandedMaterials, setExpandedMaterials] = useState<string[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Product[]>([]);
  const [materialSearchValue, setMaterialSearchValue] = useState<string>('');
  const [contacts, setContacts] = useState<Client[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [showSimpleDevisPreview, setShowSimpleDevisPreview] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'section' | 'prestation' | 'material';
    sectionId: string;
    prestationId?: string;
    materialId?: string;
  } | null>(null);
  const [showDevisWithMaterialsPreview, setShowDevisWithMaterialsPreview] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [status, setStatus] = useState(devisNumber?.status || 'DRAFT');
  const [loadingPrescribers, setLoadingPrescribers] = useState(true);
  const [showOrderFormPreview, setShowOrderFormPreview] = useState(false);
  const [globalServiceTVA, setGlobalServiceTVA] = useState(20);
  const [globalMaterialTVA, setGlobalMaterialTVA] = useState(20);
  
  // Séparer les états de chargement pour éviter les conflits
  const [isLoadingDevis, setIsLoadingDevis] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Calculer l'état de chargement global pour la compatibilité avec le code existant
  const isLoading = isLoadingDevis || isLoadingCatalog || isLoadingSave || isLoadingProducts;
  
  // Ajouter des drapeaux pour éviter les chargements multiples
  const [devisLoaded, setDevisLoaded] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  
  // États pour la modale de sélection des prestations
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [isServiceCreatorVisible, setIsServiceCreatorVisible] = useState(false);
  const [isCatalogSelectorVisible, setIsCatalogSelectorVisible] = useState(false);
  const [selectedCategoryForService, setSelectedCategoryForService] = useState<string | null>(null);
  const [catalogCategories, setCatalogCategories] = useState<{id: string, name: string}[]>([]);

  const defaultValues = {
    prescripteur: devisNumber?.reference || '',
  };

  // Références pour les composants PDF
  const simpleDevisPDFRef = useRef<React.ReactElement | null>(null);
  const devisWithMaterialsPDFRef = useRef<React.ReactElement | null>(null);
  const orderFormPDFRef = useRef<React.ReactElement | null>(null);

  // Charger les catalogues
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

  // Charger le numéro de devis
  useEffect(() => {
    const loadDevisNumber = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/devis/sequence');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du numéro de devis');
        }
        const data = await response.json();
        setDevisNumber({
          number: parseInt(data.reference.replace(/\D/g, '')),
          year: new Date().getFullYear(),
          reference: data.reference,
          status: 'DRAFT',
          prescriberId: undefined
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (params.id === 'new') {
      loadDevisNumber();
      loadOrderNumber(); // Charger le numéro de bon de commande
    }
  }, [params.id]);

  // Charger le numéro de bon de commande
  const loadOrderNumber = async () => {
    try {
      const response = await fetch('/api/bon-commande/sequence');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setOrderNumber(data.reference);
    } catch (error) {
      console.error('Erreur lors de la récupération du numéro de bon de commande:', error);
      message.error('Impossible de générer un numéro de bon de commande');
    }
  };

  // Charger les contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoadingContacts(true);
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Erreur lors du chargement des contacts');
        const data = await response.json();
        setContacts(data);
      } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        message.error('Impossible de charger les contacts');
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, []);

  // Charger les prescripteurs
  useEffect(() => {
    const loadPrescribers = async () => {
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
    };

    loadPrescribers();
  }, []);

  // Charger les clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingContacts(true);
        const response = await fetch('/api/clients');
        if (!response.ok) throw new Error('Erreur lors du chargement des clients');
        const data = await response.json();
        console.log('Clients chargés:', data);
        setContacts(data);
        
        // Si nous avons un ID de devis et que le client n'est pas encore sélectionné
        if (params.id && !selectedContact && data.length > 0) {
          const devisResponse = await fetch(`/api/devis/${params.id}`);
          if (devisResponse.ok) {
            const devisData = await devisResponse.json();
            if (devisData.clientId) {
              console.log('Setting client from devis:', devisData.clientId);
              setSelectedContact(devisData.clientId);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        message.error('Impossible de charger les clients');
      } finally {
        setLoadingContacts(false);
      }
    };

    loadClients();
  }, [params.id, selectedContact]);

  // Charger les services quand un catalogue est sélectionné
  const handleCatalogChange = async (catalogId: string) => {
    console.log('handleCatalogChange appelé avec catalogId:', catalogId);
    setSelectedCatalogId(catalogId);
    
    try {
      // Indiquer que le chargement est en cours
      setIsLoadingCatalog(true);
      
      const response = await fetch(`/api/catalogs/${catalogId}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du catalogue');
      }
      const catalogData = await response.json() as CatalogData;
      console.log('Données du catalogue chargées:', catalogData);

      // Vérifier si le catalogue a des catégories
      if (!catalogData.categories || catalogData.categories.length === 0) {
        console.log('Le catalogue ne contient aucune catégorie');
        setCatalogServices([]);
        setPrestations([]);
        return;
      }

      // Stocker les catégories du catalogue
      const categories = catalogData.categories.map((category: any) => ({
        id: category.id,
        name: category.name
      }));
      setCatalogCategories(categories);

      // Extraire les services de toutes les catégories
      const services = catalogData.categories
        .flatMap((category: Category) => 
          category.services.map((service: CatalogService) => ({
            ...service,
            categoryId: category.id,
            categoryName: category.name,
            materials: service.materials.map(m => ({
              ...m,
              reference: m.reference || ''
            }))
          }))
        );

      console.log('Services extraits du catalogue:', services.length);
      setCatalogServices(services);
      
      // Initialiser les prestations avec tous les services disponibles
      const newPrestations = services.map(service => ({
        id: service.id,
        nom: service.name,
        reference: `${service.categoryName} - ${service.name}`,
        prix: service.price || 0
      }));
      
      console.log('Nouvelles prestations:', newPrestations.length);
      setPrestations(newPrestations);
      
      // Marquer le catalogue comme chargé
      setCatalogLoaded(true);
    } catch (error) {
      console.error('Erreur lors du chargement du catalogue:', error);
      message.error('Impossible de charger le catalogue');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchValue(value);
    
    // Si la valeur est vide, afficher toutes les prestations du catalogue sélectionné
    if (!selectedCatalogId) {
      setPrestations([]);
      return;
    }

    // Si la recherche est vide, montrer toutes les prestations
    if (value.length === 0) {
      setPrestations(catalogServices.map(service => ({
        id: service.id,
        nom: service.name,
        reference: `${service.categoryName} - ${service.name}`,
        prix: service.price || 0
      })));
      return;
    }

    // Sinon, filtrer les prestations selon la recherche
    const filteredServices = catalogServices.filter(service =>
      service.name.toLowerCase().includes(value.toLowerCase()) ||
      (service.description?.toLowerCase() || '').includes(value.toLowerCase())
    );

    setPrestations(filteredServices.map(service => ({
      id: service.id,
      nom: service.name,
      reference: `${service.categoryName} - ${service.name}`,
      prix: service.price || 0
    })));
    
    // Si aucun résultat n'est trouvé, afficher un message suggérant de créer une nouvelle prestation
    if (filteredServices.length === 0 && value.length > 0) {
      message.info(
        <div>
          Aucune prestation trouvée pour "{value}". 
          <Button 
            type="link" 
            onClick={() => openCatalogSelector()}
            style={{ padding: 0, height: 'auto' }}
          >
            Créer une nouvelle prestation ?
          </Button>
        </div>, 
        5
      );
    }
  };

  const prestationOptions = catalogServices?.map(service => ({
    label: `${service.categoryName} - ${service.name} - ${service.price}€`,
    value: service.id
  })) || [];

  // Ajouter un log pour déboguer
  useEffect(() => {
    console.log('prestationOptions mis à jour:', prestationOptions.length);
    console.log('catalogServices:', catalogServices.length);
  }, [prestationOptions, catalogServices]);

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

  // Modifier la fonction handleAddPrestation
  const handleAddPrestation = (sectionId: string, prestationId: string) => {
    const service = catalogServices.find(s => s.id === prestationId);
    if (!service) return;

    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const newPrestation = {
          id: Math.random().toString(36).substr(2, 9),
          name: service.name,
          quantity: 1,
          unit: 'm²',
          unitPrice: service.price,
          tva: globalServiceTVA, // Utiliser la TVA globale des services
          amount: service.price,
          description: service.description,
          materials: service.materials.map(m => ({
            id: Math.random().toString(36).substr(2, 9),
            name: m.name,
            quantity: m.quantity,
            price: m.price,
            unit: m.unit || 'unité',
            reference: m.reference || '',
            tva: globalMaterialTVA,
            billable: false // Par défaut, le matériau n'est PAS facturable
          })),
          category: service.categoryName || 'SERVICE'
        };

        return {
          ...section,
          prestations: [...section.prestations, newPrestation]
        };
      }
      return section;
    }));
  };
  
  // Fonction pour adapter les catégories au format attendu par le composant PrestationsSelector
  const adaptCategoriesToPrestationsSelector = (categories: any[]): any[] => {
    console.log('Adaptation des catégories pour PrestationsSelector:', categories);
    
    if (!categories || !Array.isArray(categories)) {
      console.error('Les catégories ne sont pas un tableau:', categories);
      return [];
    }
    
    try {
      const adaptedCategories = categories.map(category => {
        console.log('Adaptation de la catégorie:', category);
        
        if (!category || !category.services || !Array.isArray(category.services)) {
          console.error('La catégorie ou ses services ne sont pas valides:', category);
          return {
            id: category?.id || Math.random().toString(),
            name: category?.name || 'Catégorie sans nom',
            services: []
          };
        }
        
        return {
          id: category.id,
          name: category.name,
          services: category.services.map(service => {
            console.log('Adaptation du service:', service);
            
            return {
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              quantity: service.quantity || 1,
              unit: service.unit || 'u',
              materials: (service.materials || []).map(material => ({
                id: material.id,
                name: material.name,
                quantity: material.quantity,
                price: material.price,
                unit: material.unit || 'u',
                reference: material.reference || '',
                tva: material.tva || globalMaterialTVA,
                billable: material.billable !== false
              }))
            };
          })
        };
      });
      
      console.log('Catégories adaptées:', adaptedCategories);
      return adaptedCategories;
    } catch (error) {
      console.error('Erreur lors de l\'adaptation des catégories:', error);
      return [];
    }
  };

  // Fonction pour gérer l'ajout de plusieurs prestations à la fois
  const handleAddMultiplePrestations = (selectedPrestations: any[]) => {
    console.log('handleAddMultiplePrestations appelé avec:', selectedPrestations);
    
    if (!currentSectionId) {
      console.error('Aucune section sélectionnée');
      return;
    }
    
    // Créer un tableau pour stocker les nouvelles prestations
    const newPrestations = selectedPrestations.map(prestation => {
      console.log('Traitement de la prestation:', prestation);
      
      // Créer un nouvel ID unique pour la prestation
      const newPrestationId = Math.random().toString(36).substr(2, 9);
      
      // Vérifier si la prestation a des matériaux
      const materials = prestation.materials && Array.isArray(prestation.materials) 
        ? prestation.materials.map((material: any) => {
            console.log('Traitement du matériau:', material);
            
            return {
              id: Math.random().toString(36).substr(2, 9),
              name: material.name,
              quantity: material.quantity,
              price: material.price,
              unit: material.unit || 'u',
              reference: material.reference || '',
              tva: globalMaterialTVA,
              billable: false // Par défaut, le matériau n'est PAS facturable
            };
          })
        : [];
      
      console.log('Matériaux traités:', materials);
      
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
    
    console.log('Nouvelles prestations à ajouter:', newPrestations);
    
    // Mettre à jour les sections
    setSections(prevSections => {
      const updatedSections = prevSections.map(section => {
        if (section.id === currentSectionId) {
          return {
            ...section,
            prestations: [...section.prestations, ...newPrestations]
          };
        }
        return section;
      });
      
      console.log('Sections mises à jour:', updatedSections);
      return updatedSections;
    });
    
    // Fermer la modale
    setShowPrestationsSelector(false);
    setCurrentSectionId(null);
  };

  // Modifier la fonction handleQuantityChange pour s'assurer que les valeurs sont des entiers
  const handleQuantityChange = (
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

  // Ajouter une nouvelle fonction pour gérer les changements de prix
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

  // Ajouter une nouvelle fonction pour gérer les changements de quantité des matériaux
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

  // Ajouter une fonction pour gérer le changement d'unité des matériaux
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

  // Ajouter une fonction pour gérer le changement de prix des matériaux
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

  // Modifier la fonction handleAddMaterial
  const handleAddMaterial = (sectionId: string, prestationId: string) => {
    // Ajouter un matériau vide, peu importe si des matériaux sont disponibles
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          prestations: section.prestations.map(prestation => {
            if (prestation.id === prestationId) {
              return {
                ...prestation,
                materials: [
                  ...prestation.materials,
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    quantity: 1,
                    price: 0,
                    unit: 'u',
                    reference: '',
                    tva: globalMaterialTVA,
                    billable: false
                  }
                ]
              };
            }
            return prestation;
          })
        };
      }
      return section;
    }));
  };

  // Modifions le useEffect qui charge les produits
  useEffect(() => {
    const loadProducts = async () => {
      // Ne pas charger si déjà chargé ou en cours de chargement
      if (productsLoaded || isLoadingProducts) {
        return;
      }
      
      try {
        setIsLoadingProducts(true);
        // Assurons-nous que l'API renvoie tous les matériaux
        const response = await fetch(`/api/products?category=MATERIAL&limit=1000`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des matériaux');
        }
        const data = await response.json();
        console.log('Matériaux chargés:', data.length, 'matériaux');
        
        if (data.length === 0) {
          message.warning('Aucun matériau trouvé dans la base de données.');
        }
        
        setAvailableMaterials(data);
        setProductsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des matériaux:', error);
        setError('Impossible de charger les matériaux');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [productsLoaded, isLoadingProducts]);

  // Modifier le useEffect qui charge les données du devis
  useEffect(() => {
    const loadDevis = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/devis/${params.id}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du devis');
        }
        const data = await response.json();
        console.log('Données du devis chargées:', data);
        
        // Mettre à jour les états avec les données du devis
        setDevisNumber({
          number: data.number,
          year: data.year,
          reference: data.reference,
          status: data.status,
          prescriberId: data.prescriberId
        });
        
        setStatus(data.status);
        setSelectedCatalogId(data.catalogId);
        setSelectedClient(data.clientId);
        setExpirationDate(data.expirationDate || null);
        setPaymentMethod(data.paymentMethod || null);
        setPilot(data.pilot || 'Noureddine MLAIEH');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setDevisComments(data.devisComments || '');
        setShowDevisComments(data.showDevisComments !== false);
        setOrderFormComments(data.orderFormComments || '');
        setShowOrderFormComments(data.showOrderFormComments !== false);
        setShowDescriptions(data.showDescriptions || false);
        setProjectType(data.projectType || 'AUTRE');
        
        // Adapter les sections
        const formattedSections = data.sections.map(section => ({
          id: section.id,
          name: section.name,
          prestations: section.services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description || '',
            quantity: service.quantity,
            unit: service.unit,
            unitPrice: service.price,
            tva: service.tva,
            amount: service.quantity * service.price,
            notes: service.notes || '',
            conditions: service.conditions || '',
            category: typeof section.category === 'object' ? section.category.name : section.category || 'DEFAULT',
            materials: service.materials.map(material => ({
              id: material.id,
              name: material.name,
              quantity: material.quantity,
              price: material.price,
              unit: material.unit || '',
              reference: material.reference || '',
              tva: material.tva,
              billable: material.billable
            })),
            categoryName: typeof service.category === 'object' ? service.category.name : service.category || 'SERVICE'
          })),
          materialsTotal: section.materialsTotal,
          subTotal: section.subTotal,
          category: typeof (section as any).category === 'object' 
            ? (section as any).category.name 
            : (section as any).category || 'DEFAULT'
        }));
        
        setSections(formattedSections);

        // Marquer comme chargé pour éviter les rechargements inutiles
        setDevisLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement du devis:', error);
        message.error('Erreur lors du chargement du devis');
      } finally {
        setLoading(false); // Désactiver le loading global
      }
    };

    if (params.id && params.id !== 'new' && !loadingContacts) {
      loadDevis();
    }
  }, [params.id, loadingContacts, devisLoaded, isLoadingDevis]);

  // Ajouter un useEffect pour surveiller les changements de selectedCatalogId
  useEffect(() => {
    if (selectedCatalogId) {
      const selectedCatalog = catalogs.find(c => c.id === selectedCatalogId);
      console.log('Catalogue sélectionné:', selectedCatalog);
      console.log('Catégories du catalogue sélectionné:', selectedCatalog?.categories);
    }
  }, [selectedCatalogId, catalogs]);

  // Modifier le useEffect qui charge les services du catalogue
  useEffect(() => {
    const loadCatalogServices = async () => {
      // Ne pas charger si pas de catalogue sélectionné
      if (!selectedCatalogId) {
        console.log('Aucun catalogue sélectionné, impossible de charger les services');
        setPrestations([]);
        return;
      }
      
      // Ne pas charger si déjà chargé ou en cours de chargement
      if (catalogLoaded || isLoadingCatalog) {
        console.log('Catalogue déjà chargé ou en cours de chargement, skip');
        return;
      }

      try {
        setIsLoadingCatalog(true);
        console.log('Chargement des services du catalogue:', selectedCatalogId);
        
        const response = await fetch(`/api/catalogs/${selectedCatalogId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement du catalogue');
        const catalog = await response.json();
        console.log('Catalogue chargé:', catalog);

        // Vérifier si le catalogue a des catégories
        if (!catalog.categories || catalog.categories.length === 0) {
          console.log('Le catalogue ne contient aucune catégorie');
          setCatalogServices([]);
          setPrestations([]);
          setCatalogLoaded(true);
          return;
        }

        // Mettre à jour les références
        const services = catalog.categories.flatMap((category: Category) => 
          category.services.map((service: CatalogService) => ({
            ...service,
            categoryName: category.name
          }))
        );

        console.log('Services du catalogue chargés:', services.length);
        setCatalogServices(services);
        
        // Initialiser également les prestations avec tous les services disponibles
        const newPrestations = services.map(service => ({
          id: service.id,
          nom: service.name,
          reference: `${service.categoryName} - ${service.name}`,
          prix: service.price || 0
        }));
        
        console.log('Nouvelles prestations:', newPrestations.length);
        setPrestations(newPrestations);
        
        // Marquer comme chargé pour éviter les rechargements inutiles
        setCatalogLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        message.error('Impossible de charger les services du catalogue');
      } finally {
        setIsLoadingCatalog(false);
      }
    };

    // Réinitialiser l'état de chargement du catalogue lorsque le catalogue change
    if (selectedCatalogId) {
      console.log('Catalogue sélectionné changé, rechargement des services:', selectedCatalogId);
      setCatalogLoaded(false);
      loadCatalogServices();
    } else {
      console.log('Aucun catalogue sélectionné');
      setPrestations([]);
    }
  }, [selectedCatalogId, catalogLoaded, isLoadingCatalog]);

  // Ajouter un useEffect pour suivre les changements de expirationDate
  useEffect(() => {
    console.log('expirationDate a changé:', expirationDate);  // Log 4
  }, [expirationDate]);

  // Modifier la fonction de sauvegarde
  const handleSaveDevis = async (status = 'DRAFT') => {
    try {
      setLoadingState(true);
      
      // Vérification que devisNumber n'est pas null
      if (!devisNumber) {
        message.error('Numéro de devis non disponible');
        return;
      }

      // Vérification que le client est sélectionné
      if (!selectedClient) {
        message.error('Veuillez sélectionner un client');
        return;
      }

      // Ajouter des logs pour déboguer
      console.log('Préparation des données pour la mise à jour...');
      
      // Préparer les données du devis
      const devisData = {
        status: status,
        clientId: selectedClient,
        catalogId: selectedCatalogId,
        prescriberId: devisNumber.prescriberId,
        expirationDate: expirationDate,
        paymentMethod: paymentMethod,
        pilot: pilot,
        phone: phone,
        email: email,
        projectType: projectType,
        devisComments: devisComments,
        showDevisComments: showDevisComments,
        orderFormComments: orderFormComments,
        showOrderFormComments: showOrderFormComments,
        showDescriptions: showDescriptions,
        sections: sections.map(section => {
          // Convertir les prestations en services pour l'API
          const services = section.prestations.map(prestation => {
            return {
              name: prestation.name,
              description: prestation.description || '',
              quantity: prestation.quantity || 0,
              unit: prestation.unit || '',
              // Utiliser unitPrice pour price
              price: prestation.unitPrice || 0,
              tva: prestation.tva || 20,
              category: typeof prestation.category === 'object' 
                ? prestation.category.name 
                : prestation.category || 'SERVICE',
              // Convertir les matériaux
              materials: prestation.materials.map(material => ({
                name: material.name,
                quantity: material.quantity || 0,
                price: material.price || 0,
                unit: material.unit || '',
                reference: material.reference || '',
                tva: material.tva || 20,
                billable: material.billable
              }))
            };
          });

          return {
            name: section.name,
            materialsTotal: section.materialsTotal || 0,
            subTotal: section.subTotal || 0,
            category: typeof section.category === 'object' 
              ? section.category.name 
              : section.category || 'DEFAULT',
            services: services
          };
        })
      };

      console.log('Données complètes à envoyer (JSON):', JSON.stringify(devisData, null, 2));

      let response;
      let url;
      
      if (params.id === 'new') {
        // Création d'un nouveau devis
        console.log('Création d\'un nouveau devis...');
        url = '/api/devis';
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(devisData),
        });
      } else {
        // Mise à jour d'un devis existant
        console.log('Mise à jour du devis existant:', params.id);
        url = `/api/devis/${params.id}`;
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...devisData,
            id: params.id
          }),
        });
      }

      console.log(`Requête envoyée à ${url}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Réponse d\'erreur du serveur:', errorData);
        throw new Error(`Erreur lors de la sauvegarde du devis: ${errorData.error || errorData.details || 'Erreur inconnue'}`);
      }

      const savedDevis = await response.json();
      console.log('Devis sauvegardé avec succès:', savedDevis);
      
      // Afficher un message de succès
      message.success('Devis enregistré avec succès');
      
      // Si c'est un nouveau devis, rediriger vers la page d'édition avec l'ID créé
      if (params.id === 'new') {
        router.push(`/devis/${savedDevis.id}/edit`);
      }
      
      return savedDevis;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du devis:', error);
      message.error(`Erreur lors de la sauvegarde du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return null;
    } finally {
      setLoadingState(false);
    }
  };

  // Ajouter un useEffect pour mettre à jour isClient
  useEffect(() => {
    // Utiliser un petit délai pour s'assurer que le composant est bien monté
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Ajouter un useEffect pour calculer les totaux après la mise à jour des sections
  useEffect(() => {
    if (sections.length > 0) {
      console.log('Calculating totals for sections:', sections);
      const newTotals = calculateTotals(sections);
      console.log('New totals:', newTotals);
      setTotals(newTotals);
    }
  }, [sections]);

  // Modifier le composant renderTotalsFooter pour qu'il ne soit plus fixé en bas
  const renderTotalsFooter = () => (
    <div className="bg-white border rounded-lg shadow-sm mt-4">
      <div className="p-4">
        <div className="flex justify-between items-start">
          {/* Boutons d'action à gauche */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              icon={<EyeOutlined />}
              onClick={() => handleOpenSimpleDevisPreview()}
              className="w-full"
            >
              Visualiser devis simple
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={() => handleOpenDevisWithMaterialsPreview()}
              className="w-full"
            >
              Visualiser devis avec matériaux
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handleOpenOrderFormPreview()}
              className="w-full"
            >
              Bon de commande
            </Button>
            <Button 
              icon={<FileTextOutlined />}
              onClick={() => setShowCreateInvoiceModal(true)}
              className="w-full"
            >
              Créer une facture
            </Button>
          </div>

          {/* Tableau des totaux à droite */}
          <table className="min-w-[500px] border-collapse">
            <tbody>
              {/* Services */}
              <tr className="border-b">
                <td className="py-2 font-medium">Services:</td>
                <td className="py-2 text-right">HT</td>
                <td className="py-2 text-right w-28">{totals.services.totalHT.toFixed(2)} €</td>
                <td className="py-2 text-right">TVA 20%</td>
                <td className="py-2 text-right w-28">
                  {totals.services.tvaDetails.reduce((sum, { tva }) => sum + tva, 0).toFixed(2)} €
                </td>
                <td className="py-2 text-right">TTC</td>
                <td className="py-2 text-right w-28">
                  {(totals.services.totalHT + totals.services.tvaDetails.reduce((sum, { tva }) => sum + tva, 0)).toFixed(2)} €
                </td>
              </tr>

              {/* Matériaux */}
              <tr className="border-b">
                <td className="py-2 font-medium">Matériaux:</td>
                <td className="py-2 text-right">HT</td>
                <td className="py-2 text-right w-28">{totals.materials.totalHT.toFixed(2)} €</td>
                <td className="py-2 text-right">TVA 20%</td>
                <td className="py-2 text-right w-28">
                  {totals.materials.tvaDetails.reduce((sum, { tva }) => sum + tva, 0).toFixed(2)} €
                </td>
                <td className="py-2 text-right">TTC</td>
                <td className="py-2 text-right w-28">
                  {(totals.materials.totalHT + totals.materials.tvaDetails.reduce((sum, { tva }) => sum + tva, 0)).toFixed(2)} €
                </td>
              </tr>

              {/* Total */}
              <tr>
                <td className="py-2 font-medium">Total:</td>
                <td className="py-2 text-right">HT</td>
                <td className="py-2 text-right w-28 font-semibold">{totals.totalHT.toFixed(2)} €</td>
                <td className="py-2 text-right">TVA 20%</td>
                <td className="py-2 text-right w-28 font-semibold">{totals.totalTVA.toFixed(2)} €</td>
                <td className="py-2 text-right">TTC</td>
                <td className="py-2 text-right w-28 font-bold">{totals.totalTTC.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Ajouter une fonction pour formater les nombres
  const formatNumber = (num: number) => {
    return num.toFixed(2).replace('.', ',');
  };

  // Ajouter la fonction de gestion du changement de référence
  const handleMaterialReferenceChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    newReference: string
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
                      reference: newReference
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

  // Ajouter cette fonction avec les autres handlers
  const handleMaterialNameChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    name: string
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
                    return { ...material, name };
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

  // Ajouter les fonctions de suppression
  const handleDelete = () => {
    if (!itemToDelete) return;

    let newSections;
    switch (itemToDelete.type) {
      case 'section':
        newSections = sections.filter(s => s.id !== itemToDelete.sectionId);
        break;
      case 'prestation':
        newSections = sections.map(section => {
          if (section.id === itemToDelete.sectionId) {
            return {
              ...section,
              prestations: section.prestations.filter(p => p.id !== itemToDelete.prestationId)
            };
          }
          return section;
        });
        break;
      case 'material':
        newSections = sections.map(section => {
          if (section.id === itemToDelete.sectionId) {
            return {
              ...section,
              prestations: section.prestations.map(prestation => {
                if (prestation.id === itemToDelete.prestationId) {
                  return {
                    ...prestation,
                    materials: prestation.materials.filter(m => m.id !== itemToDelete.materialId)
                  };
                }
                return prestation;
              })
            };
          }
          return section;
        });
        break;
      default:
        newSections = sections;
    }

    setSections(newSections);
    calculateTotals(newSections);
    setSearchValue(''); // Réinitialiser la recherche
    handleSearch(''); // Recharger toutes les prestations
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Fonction pour convertir une image en base64
  const getBase64Logo = async (): Promise<string | null> => {
    try {
      const response = await fetch('/images/logo.png');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // S'assurer que le préfixe data URL est présent
          resolve(base64data.startsWith('data:') ? base64data : `data:image/png;base64,${base64data.split(',')[1]}`);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erreur lors du chargement du logo:', error);
      return null;
    }
  };

  useEffect(() => {
    getBase64Logo().then(base64 => setLogoBase64(base64));
  }, []);

  const handleDownloadPDF = async () => {
    try {
      const selectedContactData = contacts.find(c => c.id === selectedContact);
      const fileName = generateFileName(selectedContactData);
      
      // Le numéro de bon de commande est maintenant généré automatiquement dans le composant OrderFormPDF
      
      // Si vous utilisez react-pdf pour générer le blob
      const blob = await pdf(
        <OrderFormPDF 
          sections={sections}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={companyInfo}
          orderFormComments={orderFormComments}
          showOrderFormComments={showOrderFormComments}
          pilot={pilot}
          phone={phone}
          email={email}
          devisReference={devisNumber?.reference}
        />
      ).toBlob();
      
      // Créer un lien temporaire pour le téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      message.error('Erreur lors de la génération du PDF');
    }
  };

  const handleShowDevisWithMaterials = () => {
    console.log('Showing devis with materials');
    console.log('Sections:', sections);
    console.log('Totals:', totals);
    console.log('Contact:', contacts.find(c => c.id === selectedContact));
    console.log('Company:', companyInfo);
    setShowDevisWithMaterialsPreview(true);
  };

  // Modifier la fonction handleAddMaterial pour utiliser un matériau existant
  const handleMaterialSelect = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    selectedProduct: Product
  ) => {
    console.log('Produit sélectionné:', selectedProduct); // Log pour déboguer
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
                    const updatedMaterial = {
                      ...material,
                      name: selectedProduct.name,
                      price: selectedProduct.sellingPrice,
                      unit: selectedProduct.unit,
                      reference: selectedProduct.reference || '',
                      tva: material.tva
                    };
                    console.log('Matériau mis à jour:', updatedMaterial); // Log pour déboguer
                    return updatedMaterial;
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
                    return { ...material, tva: newTVA };
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

  // Ajouter les gestionnaires de changement de TVA globale
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

  // Ajouter la fonction de calcul des totaux
  const calculateTotals = (currentSections: Section[]) => {
    const servicesByTVA: { [key: number]: { ht: number; tva: number } } = {};
    const materialsByTVA: { [key: number]: { ht: number; tva: number } } = {};

    currentSections.forEach(section => {
      section.prestations.forEach(prestation => {
        // Calcul pour les services
        const tauxTVA = prestation.tva;
        if (!servicesByTVA[tauxTVA]) {
          servicesByTVA[tauxTVA] = { ht: 0, tva: 0 };
        }
        const prestationHT = prestation.quantity * prestation.unitPrice;
        servicesByTVA[tauxTVA].ht += prestationHT;
        servicesByTVA[tauxTVA].tva += prestationHT * (tauxTVA / 100);

        // Calcul pour les matériaux
        prestation.materials.forEach(material => {
          // Ne prendre en compte que les matériaux facturables
          if (material.billable !== false) {
            const materialTVA = material.tva;
            if (!materialsByTVA[materialTVA]) {
              materialsByTVA[materialTVA] = { ht: 0, tva: 0 };
            }
            const materialHT = material.quantity * material.price;
            materialsByTVA[materialTVA].ht += materialHT;
            materialsByTVA[materialTVA].tva += materialHT * (materialTVA / 100);
          }
        });
      });
    });

    const servicesTotals = {
      totalHT: Object.values(servicesByTVA).reduce((sum, { ht }) => sum + ht, 0),
      tvaDetails: Object.entries(servicesByTVA).map(([taux, { ht, tva }]) => ({
        taux: Number(taux),
        ht,
        tva
      }))
    };

    const materialsTotals = {
      totalHT: Object.values(materialsByTVA).reduce((sum, { ht }) => sum + ht, 0),
      tvaDetails: Object.entries(materialsByTVA).map(([taux, { ht, tva }]) => ({
        taux: Number(taux),
        ht,
        tva
      }))
    };

    const totalHT = servicesTotals.totalHT + materialsTotals.totalHT;
    const totalTVA = Object.values(servicesByTVA).reduce((sum, { tva }) => sum + tva, 0) +
                     Object.values(materialsByTVA).reduce((sum, { tva }) => sum + tva, 0);

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
      services: servicesTotals,
      materials: materialsTotals
    };
  };

  // Ajouter une fonction pour gérer le changement d'état de facturation
  const handleMaterialBillableChange = (
    sectionId: string,
    prestationId: string,
    materialId: string,
    billable: boolean
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
                    return { ...material, billable };
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

  // Ajouter un useEffect pour mettre à jour isClient et préparer les composants PDF
  useEffect(() => {
    setIsClient(true);
    
    // Préparer les composants PDF une seule fois
    if (!simpleDevisPDFRef.current && sections.length > 0 && totals) {
      simpleDevisPDFRef.current = (
        <DevisPDF 
          devisNumber={devisNumber?.reference || ''}
          sections={sections}
          totals={totals}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={{
            ...companyInfo,
            logo: logoBase64 || '/images/logo.png'
          }}
          expirationDate={expirationDate === null ? undefined : expirationDate}
          paymentMethod={paymentMethod || ''}
          pilot={pilot || 'Noureddine MLAIEH'}
          devisComments={devisComments}
          showDevisComments={showDevisComments}
          showDescriptions={showDescriptions}
        />
      );
    }
    
    if (!devisWithMaterialsPDFRef.current && sections.length > 0 && totals) {
      devisWithMaterialsPDFRef.current = (
        <DevisWithMaterialsPDF 
          devisNumber={devisNumber?.reference || ''}
          sections={sections}
          totals={{
            totalHT: totals.totalHT,
            totalTVA: totals.totalTVA,
            totalTTC: totals.totalTTC,
            services: totals.services,
            materials: totals.materials
          }}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={{
            ...companyInfo,
            logo: logoBase64 || '/images/logo.png'
          }}
          pilot={pilot || 'Noureddine MLAIEH'}
          expirationDate={expirationDate === null ? undefined : expirationDate}
          devisComments={devisComments}
          showDevisComments={showDevisComments}
          paymentMethod={paymentMethod || ''}
        />
      );
    }
    
    if (!orderFormPDFRef.current && sections.length > 0) {
      orderFormPDFRef.current = (
        <OrderFormPDF 
          sections={sections}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={companyInfo}
          orderFormComments={orderFormComments}
          showOrderFormComments={showOrderFormComments}
          pilot={pilot}
          phone={phone}
          email={email}
          devisReference={devisNumber?.reference}
        />
      );
    }
  }, [sections, totals, devisNumber, selectedContact, contacts, prescribers, companyInfo, logoBase64, expirationDate, paymentMethod, pilot, devisComments, showDevisComments, showDescriptions, orderFormComments, showOrderFormComments, phone, email]);

  // Fonction pour mettre à jour les références PDF
  const updatePDFRefs = () => {
    if (sections.length > 0 && totals && selectedContact) {
      // Mettre à jour le PDF du devis simple
      simpleDevisPDFRef.current = (
        <DevisPDF 
          devisNumber={devisNumber?.reference || ''}
          sections={sections}
          totals={totals}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={{
            ...companyInfo,
            logo: logoBase64 || '/images/logo.png'
          }}
          expirationDate={expirationDate === null ? undefined : expirationDate}
          paymentMethod={paymentMethod || ''}
          pilot={pilot || 'Noureddine MLAIEH'}
          devisComments={devisComments}
          showDevisComments={showDevisComments}
          showDescriptions={showDescriptions}
        />
      );
      
      // Mettre à jour le PDF du devis avec matériaux
      devisWithMaterialsPDFRef.current = (
        <DevisWithMaterialsPDF 
          devisNumber={devisNumber?.reference || ''}
          sections={sections}
          totals={{
            totalHT: totals.totalHT,
            totalTVA: totals.totalTVA,
            totalTTC: totals.totalTTC,
            services: totals.services,
            materials: totals.materials
          }}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={{
            ...companyInfo,
            logo: logoBase64 || '/images/logo.png'
          }}
          pilot={pilot || 'Noureddine MLAIEH'}
          expirationDate={expirationDate === null ? undefined : expirationDate}
          devisComments={devisComments}
          showDevisComments={showDevisComments}
          paymentMethod={paymentMethod || ''}
        />
      );
      
      // Mettre à jour le PDF du bon de commande
      orderFormPDFRef.current = (
        <OrderFormPDF 
          sections={sections}
          contact={{
            name: contacts.find(c => c.id === selectedContact)?.name || 'Client non spécifié',
            address: contacts.find(c => c.id === selectedContact)?.address,
            postalCode: contacts.find(c => c.id === selectedContact)?.postalCode,
            city: contacts.find(c => c.id === selectedContact)?.city,
            country: contacts.find(c => c.id === selectedContact)?.country,
            phone: contacts.find(c => c.id === selectedContact)?.phone,
            prescriber: prescribers.find(p => p.id === devisNumber?.prescriberId)
          }}
          company={companyInfo}
          orderFormComments={orderFormComments}
          showOrderFormComments={showOrderFormComments}
          pilot={pilot}
          phone={phone}
          email={email}
          devisReference={devisNumber?.reference}
        />
      );
    }
  };
  
  // Mettre à jour les références PDF lorsque les données changent
  useEffect(() => {
    if (isClient) {
      updatePDFRefs();
    }
  }, [isClient, sections, totals, devisNumber, selectedContact, contacts, prescribers, companyInfo, logoBase64, expirationDate, paymentMethod, pilot, devisComments, showDevisComments, showDescriptions, orderFormComments, showOrderFormComments, phone, email]);
  
  // Mettre à jour les références PDF avant d'ouvrir les modales
  const handleOpenSimpleDevisPreview = () => {
    updatePDFRefs();
    setShowSimpleDevisPreview(true);
  };
  
  const handleOpenDevisWithMaterialsPreview = () => {
    updatePDFRefs();
    setShowDevisWithMaterialsPreview(true);
  };
  
  const handleOpenOrderFormPreview = () => {
    updatePDFRefs();
    setShowOrderFormPreview(true);
  };

  // Fonction pour gérer la création d'une nouvelle prestation
  const handleServiceCreated = (newService: any) => {
    // Fermer la modale
    setIsServiceCreatorVisible(false);
    
    // Forcer le rechargement des prestations
    if (selectedCatalogId) {
      setCatalogLoaded(false);
    }
    
    // Ajouter la nouvelle prestation à la section courante
    if (currentSectionId && newService) {
      const newPrestation = {
        id: Math.random().toString(36).substr(2, 9),
        name: newService.name,
        quantity: 1,
        unit: newService.unit || 'm²',
        unitPrice: newService.price || 0,
        tva: globalServiceTVA,
        amount: newService.price || 0,
        description: newService.description || '',
        notes: '',
        conditions: '',
        category: { name: newService.categoryName || '' },
        materials: (newService.materials || []).map((material: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: material.name,
          quantity: material.quantity || 1,
          price: material.price || 0,
          unit: material.unit || 'u',
          reference: material.reference || '',
          tva: globalMaterialTVA,
          billable: false
        }))
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

  // Ajouter un useEffect pour initialiser les prestations lorsque catalogServices change
  useEffect(() => {
    if (catalogServices.length > 0) {
      console.log('Initialisation des prestations depuis catalogServices:', catalogServices.length);
      setPrestations(catalogServices.map(service => ({
        id: service.id,
        nom: service.name,
        reference: `${service.categoryName} - ${service.name}`,
        prix: service.price || 0
      })));
    } else {
      console.log('catalogServices est vide, impossible d\'initialiser les prestations');
    }
  }, [catalogServices]);

  // Fonction pour ouvrir la modale de sélection de catalogue et catégorie
  const openCatalogSelector = () => {
    setIsCatalogSelectorVisible(true);
  };

  // Fonction pour continuer vers la création de prestation après sélection de catégorie
  const continueToServiceCreation = (categoryId: string) => {
    setSelectedCategoryForService(categoryId);
    setIsCatalogSelectorVisible(false);
    setIsServiceCreatorVisible(true);
  };

  if (loading || catalogsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Erreur: {error}</div>;
  }

  if (!devisNumber) {
    return <div className="text-center p-4">Impossible de générer le numéro de devis</div>;
  }

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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Modifier le Devis {devisNumber?.reference}</h1>
          <div className="space-x-4">
            <Button onClick={() => router.push('/devis')}>
              Annuler
            </Button>
            <Button 
              onClick={() => setShowCreateInvoiceModal(true)}
              icon={<DollarOutlined />}
            >
              Créer Facture
            </Button>
            <Button 
              type="primary"
              onClick={() => handleSaveDevis(status)}
              disabled={!selectedContact || sections.length === 0}
            >
              Enregistrer
            </Button>
          </div>
        </div>
        
        <Card className="mb-4">
          <Form layout="vertical">
            <div className="p-6 space-y-6">
              {/* En-tête du devis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Numéro de devis */}
                <div>
                  <Form.Item label="Numéro de devis">
                    <Input
                      value={devisNumber?.reference}
                      disabled
                      className="reference-input"
                    />
                  </Form.Item>
                </div>

                {/* Statut */}
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

                {/* Client */}
                <div>
                  <Form.Item 
                    label="Client" 
                    required 
                    validateStatus={selectedContact ? 'success' : 'error'}
                  >
                    <Select
                      showSearch
                      placeholder="Sélectionner un client"
                      className="w-full"
                      value={selectedContact}
                      onChange={setSelectedContact}
                      options={contacts.map(contact => ({
                        value: contact.id,
                        label: contact.name
                      }))}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* Deuxième ligne */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Catalogue */}
                <div>
                  <Form.Item 
                    label="Catalogue" 
                    required
                    validateStatus={selectedCatalogId ? 'success' : 'error'}
                  >
                    <Select
                      showSearch
                      placeholder="Sélectionner un catalogue"
                      className="w-full"
                      value={selectedCatalogId}
                      onChange={handleCatalogChange}
                      options={catalogs.map(catalog => ({
                        value: catalog.id,
                        label: catalog.name
                      }))}
                    />
                  </Form.Item>
                </div>

                {/* Prescripteur */}
                <div>
                  <Form.Item label="Prescripteur">
                    <Select
                      placeholder="Sélectionner un prescripteur"
                      className="w-full"
                      value={devisNumber?.prescriberId}
                      onChange={(value) => {
                        setDevisNumber(prev => prev ? {...prev, prescriberId: value} : null);
                      }}
                      options={prescribers.map(prescriber => ({
                        value: prescriber.id,
                        label: prescriber.nom
                      }))}
                    />
                  </Form.Item>
                </div>

                {/* TVA globale */}
                <div className="flex gap-4">
                  <Form.Item label="TVA Services" className="flex-1">
                    <Select
                      value={globalServiceTVA}
                      onChange={handleGlobalServiceTVAChange}
                      className="w-full"
                      options={[
                        { value: 20, label: '20%' },
                        { value: 10, label: '10%' },
                        { value: 5.5, label: '5.5%' }
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="TVA Matériaux" className="flex-1">
                    <Select
                      value={globalMaterialTVA}
                      onChange={handleGlobalMaterialTVAChange}
                      className="w-full"
                      options={[
                        { value: 20, label: '20%' },
                        { value: 10, label: '10%' },
                        { value: 5.5, label: '5.5%' }
                      ]}
                    />
                  </Form.Item>
                </div>

                {/* Nouveaux champs */}
                <div>
                  <Form.Item label="Date d'expiration">
                    <Input
                      type="date"
                      value={expirationDate === null ? '' : expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                    />
                  </Form.Item>
                </div>

                <div>
                  <Form.Item label="Mode de paiement">
                    <Select
                      value={paymentMethod}
                      onChange={(value) => setPaymentMethod(value)}
                      placeholder="Sélectionner un mode de paiement"
                    >
                      {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                        <Select.Option key={key} value={value}>
                          {value}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Form.Item label="Client">
                    <Select
                      showSearch
                      placeholder="Sélectionner un client"
                      className="w-full"
                      value={selectedClient}
                      onChange={setSelectedClient}
                      options={clients.map(client => ({
                        value: client.id,
                        label: client.name
                      }))}
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

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
                          setItemToDelete({
                            type: 'section',
                            sectionId: section.id
                          });
                          setShowDeleteModal(true);
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
                          <tr>
                            <th className="text-left w-[40%]">Prestation</th>
                            <th className="text-center w-[120px]">Quantité</th>
                            <th className="text-center w-[100px]">Unité</th>
                            <th className="text-right w-[120px]">Prix unité</th>
                            <th className="text-right w-[100px]">TVA</th>
                            <th className="text-right w-[120px]">Montant</th>
                            <th className="w-[50px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.prestations.map((prestation, prestationIndex) => (
                            <React.Fragment key={`prestation-${prestation.id}-${prestationIndex}`}>
                              <tr>
                                <td className="py-2">
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
                                    <Input
                                      value={prestation.name}
                                      onChange={(e) => handleMaterialNameChange(section.id, prestation.id, prestation.id, e.target.value)}
                                      className="w-full"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 text-center">
                                  <InputNumber
                                    value={prestation.quantity}
                                    className="w-24 right-aligned-input"
                                    min={0}
                                    step={1.00}
                                    precision={2}
                                    decimalSeparator=","
                                    onChange={(value) => handleQuantityChange(section.id, prestation.id, value || 0)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <Select
                                    value={prestation.unit}
                                    onChange={(value) => handleMaterialUnitChange(section.id, prestation.id, prestation.id, value)}
                                    className="w-[100px]"
                                    options={[
                                      { value: 'm²', label: 'm²' },
                                      { value: 'ml', label: 'ml' },
                                      { value: 'u', label: 'u' }
                                    ]}
                                  />
                                </td>
                                <td className="py-2 text-right">
                                  <InputNumber
                                    value={prestation.unitPrice}
                                    onChange={(value) => handlePriceChange(section.id, prestation.id, value || 0)}
                                    className="w-[120px]"
                                    controls={false}
                                    addonAfter="€"
                                  />
                                </td>
                                <td className="py-2 text-right">
                                  <Select
                                    value={prestation.tva}
                                    onChange={(value) => handleMaterialTVAChange(section.id, prestation.id, prestation.id, value)}
                                    className="w-[100px]"
                                    options={[
                                      { value: 20, label: '20%' },
                                      { value: 10, label: '10%' },
                                      { value: 5.5, label: '5.5%' }
                                    ]}
                                  />
                                </td>
                                <td className="py-2 text-right">
                                  <span className="px-2">
                                    {(prestation.quantity * prestation.unitPrice).toFixed(2)} €
                                  </span>
                                </td>
                                <td className="py-2">
                                  <div className="material-actions flex items-center">
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
                                              if (prestation.materials && prestation.materials.length > 0) {
                                                setItemToDelete({
                                                  type: 'material',
                                                  sectionId: section.id,
                                                  prestationId: prestation.id,
                                                  materialId: prestation.materials[0].id
                                                });
                                              } else {
                                                setItemToDelete({
                                                  type: 'prestation',
                                                  sectionId: section.id,
                                                  prestationId: prestation.id
                                                });
                                              }
                                              setShowDeleteModal(true);
                                            }
                                          }
                                        ]
                                      }}
                                      trigger={['click']}
                                      placement="bottomRight"
                                    >
                                      <Button type="text" icon={<MoreOutlined />} className="text-gray-500 hover:text-blue-500" />
                                    </Dropdown>
                                  </div>
                                </td>
                              </tr>

                              {expandedPrestations.includes(prestation.id) && (
                                <tr>
                                  <td colSpan={7} className="bg-gray-50">
                                    <div className="pl-8 py-2">
                                      <div className="material-header">
                                        <div className="flex items-center gap-2 mb-2">
                                          <button
                                            onClick={() => {
                                              setExpandedMaterials(
                                                expandedMaterials.includes(prestation.id)
                                                  ? expandedMaterials.filter(id => id !== prestation.id)
                                                  : [...expandedMaterials, prestation.id]
                                              );
                                            }}
                                            className="text-gray-500 hover:text-blue-500"
                                          >
                                            {expandedMaterials.includes(prestation.id) ? <DownOutlined /> : <RightOutlined />}
                                          </button>
                                          <span className="font-medium">Matériaux</span>
                                          <span className="text-gray-500">({prestation.materials.length} matériaux inclus)</span>
                                        </div>
                                      </div>
                                      
                                      {expandedMaterials.includes(prestation.id) && (
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse material-table">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="text-left p-2 w-[40%]">Nom</th>
                                                <th className="text-left p-2 w-[10%] reference-column">Référence</th>
                                                <th className="text-center p-2 w-[10%] quantity-column">Quantité</th>
                                                <th className="text-center p-2 w-[10%] unit-column">Unité</th>
                                                <th className="text-right p-2 w-[10%] price-column">Prix unitaire</th>
                                                <th className="text-center p-2 w-[7%] tva-column">TVA</th>
                                                <th className="text-center p-2 w-[10%] billable-column">Facturer</th>
                                                <th className="text-right p-2 w-[8%] total-column">Total</th>
                                                <th className="w-[0%] action-column"></th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {prestation.materials.map((material, materialIndex) => (
                                                <tr key={material.id} className="border-t">
                                                  <td className="p-2">
                                                    <Select
                                                      showSearch
                                                      value={material.name}
                                                      className="material-name"
                                                      placeholder="Rechercher un matériau..."
                                                      optionFilterProp="children"
                                                      title={material.name} // Utiliser l'attribut title HTML standard au lieu du Tooltip
                                                      onChange={(value) => {
                                                        const selectedProduct = availableMaterials.find(m => m.id === value);
                                                        if (selectedProduct) {
                                                          handleMaterialSelect(section.id, prestation.id, material.id, selectedProduct);
                                                        }
                                                      }}
                                                      filterOption={(input, option) =>
                                                        (option?.label as string).toLowerCase().includes(input.toLowerCase())
                                                      }
                                                      options={availableMaterials.map(m => ({
                                                        value: m.id,
                                                        label: `${m.name} ${m.reference ? `(${m.reference})` : ''} - ${m.sellingPrice}€`
                                                      }))}
                                                    />
                                                  </td>
                                                  <td className="p-2 reference-column">
                                                    <Input
                                                      value={material.reference || ''}
                                                      onChange={(e) => handleMaterialReferenceChange(section.id, prestation.id, material.id, e.target.value)}
                                                      className="w-full"
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center quantity-column">
                                                    <InputNumber
                                                      value={material.quantity}
                                                      className="w-24 right-aligned-input"
                                                      min={0}
                                                      step={1.00}
                                                      precision={2}
                                                      decimalSeparator=","
                                                      onChange={(value) => handleMaterialQuantityChange(
                                                        section.id,
                                                        prestation.id,
                                                        material.id,
                                                        value || 0
                                                      )}
                                                      onWheel={(e) => e.currentTarget.blur()}
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center unit-column">
                                                    <Select
                                                      value={material.unit}
                                                      onChange={(value) => handleMaterialUnitChange(section.id, prestation.id, material.id, value)}
                                                      className="w-full"
                                                      options={[
                                                        { value: 'u', label: 'u' },
                                                        { value: 'm²', label: 'm²' },
                                                        { value: 'ml', label: 'ml' }
                                                      ]}
                                                    />
                                                  </td>
                                                  <td className="p-2 text-right price-column">
                                                    <InputNumber
                                                      value={material.price}
                                                      onChange={(value) => handleMaterialPriceChange(section.id, prestation.id, material.id, value || 0)}
                                                      className="w-full"
                                                      controls={false}
                                                      addonAfter="€"
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center tva-column">
                                                    <Select
                                                      value={material.tva}
                                                      onChange={(value) => handleMaterialTVAChange(section.id, prestation.id, material.id, value)}
                                                      className="w-full"
                                                      options={[
                                                        { value: 20, label: '20%' },
                                                        { value: 10, label: '10%' },
                                                        { value: 5.5, label: '5.5%' }
                                                      ]}
                                                    />
                                                  </td>
                                                  <td className="p-2 text-center billable-column">
                                                    <Checkbox
                                                      checked={material.billable !== false}
                                                      onChange={(e) => handleMaterialBillableChange(section.id, prestation.id, material.id, e.target.checked)}
                                                    />
                                                  </td>
                                                  <td className="p-2 text-right font-medium total-column">
                                                    {material.billable !== false ? (material.quantity * material.price).toFixed(2) : "0.00"} €
                                                  </td>
                                                  <td className="p-2 action-column">
                                                    <button
                                                      className="text-red-500 hover:text-red-700"
                                                      onClick={() => {
                                                        if (prestation.materials && prestation.materials.length > 0) {
                                                          setItemToDelete({
                                                            type: 'material',
                                                            sectionId: section.id,
                                                            prestationId: prestation.id,
                                                            materialId: prestation.materials[0].id
                                                          });
                                                        } else {
                                                          setItemToDelete({
                                                            type: 'prestation',
                                                            sectionId: section.id,
                                                            prestationId: prestation.id
                                                          });
                                                        }
                                                        setShowDeleteModal(true);
                                                      }}
                                                    >
                                                      🗑️
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                            <tfoot>
                                              <tr>
                                                <td colSpan={9} className="p-2">
                                                  <button
                                                    onClick={() => handleAddMaterial(section.id, prestation.id)}
                                                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 material-selector"
                                                  >
                                                    <span>+</span> Ajouter un matériau
                                                  </button>
                                                </td>
                                              </tr>
                                            </tfoot>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                          <tr>
                            <td colSpan={7} className="pt-4">
                              <div className="flex items-center gap-2 bg-white border rounded p-2">
                                <span className="text-blue-600 text-xl">+</span>
                                <Select
                                  showSearch
                                  className="prestation-select flex-grow"
                                  value={searchValue}
                                  style={{ width: '100%' }}
                                  placeholder="Ajouter une prestation..."
                                  suffixIcon={<span className="text-gray-400">▼</span>}
                                  variant="borderless"
                                  options={prestationOptions}
                                  onChange={(value) => handleAddPrestation(section.id, value)}
                                  filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                  }
                                  notFoundContent={isLoading ? <Spin size="small" /> : "Aucune prestation trouvée"}
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
            {showPrestationsSelector && (
              <PrestationsSelector
                visible={showPrestationsSelector}
                onCancel={() => {
                  console.log('Fermeture de la modale PrestationsSelector');
                  setShowPrestationsSelector(false);
                }}
                onAdd={(selectedPrestations) => {
                  console.log('Prestations sélectionnées dans PrestationsSelector:', selectedPrestations);
                  handleAddMultiplePrestations(selectedPrestations);
                }}
                catalogId={selectedCatalogId || undefined}
              />
            )}

            {/* Section dédiée pour l'affichage des descriptions */}
            <Card className="mt-4 mb-4" type="inner">
              <div className="flex items-center">
                <Checkbox 
                  checked={showDescriptions} 
                  onChange={(e) => setShowDescriptions(e.target.checked)}
                />
                <span className="ml-2 font-medium">Afficher les descriptions des prestations dans le devis</span>
              </div>
            </Card>

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

            {/* Remplacer le footer fixe par le nouveau composant */}
            {totals && renderTotalsFooter()}

            {/* Modal pour le devis simple */}
            <Modal
              title="Aperçu du devis simple"
              open={showSimpleDevisPreview}
              onCancel={() => setShowSimpleDevisPreview(false)}
              width="90%"
              style={{ top: 20 }}
              bodyStyle={{ height: 'calc(100vh - 120px)', padding: '12px' }}
              footer={null}
            >
              {isClient && simpleDevisPDFRef.current && (
                <PDFViewer style={{ width: '100%', height: '100%' }}>
                  {simpleDevisPDFRef.current}
                </PDFViewer>
              )}
              {isClient && !simpleDevisPDFRef.current && (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" tip="Préparation du PDF..." />
                </div>
              )}
            </Modal>

            {/* Modal pour le devis avec matériaux */}
            <Modal
              title="Aperçu du devis avec matériaux"
              open={showDevisWithMaterialsPreview}
              onCancel={() => setShowDevisWithMaterialsPreview(false)}
              width="90%"
              style={{ top: 20 }}
              bodyStyle={{ height: 'calc(100vh - 120px)', padding: '12px' }}
              footer={null}
            >
              {isClient && devisWithMaterialsPDFRef.current && (
                <PDFViewer style={{ width: '100%', height: '100%' }}>
                  {devisWithMaterialsPDFRef.current}
                </PDFViewer>
              )}
              {isClient && !devisWithMaterialsPDFRef.current && (
                <div className="flex justify-center items-center h-full">
                  <Spin size="large" tip="Préparation du PDF..." />
                </div>
              )}
            </Modal>

            {/* Modal de confirmation */}
            <Modal
              title="Confirmation de suppression"
              open={showDeleteModal}
              onCancel={() => {
                setShowDeleteModal(false);
                setItemToDelete(null);
              }}
              onOk={handleDelete}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
            >
              <p>Êtes-vous sûr de vouloir supprimer cet élément ?</p>
              <p className="text-gray-500">Cette action est irréversible.</p>
            </Modal>

            {/* Modal de bon de commande */}
            <Modal
              title="Bon de commande"
              open={showOrderFormPreview}
              onCancel={() => setShowOrderFormPreview(false)}
              width="90%"
              style={{ top: 20 }}
              bodyStyle={{ height: 'calc(100vh - 120px)', padding: '12px' }}
              footer={null}
            >
              {isClient && (
                <>
                  <div className="mb-4">
                    <Button onClick={handleDownloadPDF}>
                      Télécharger le bon de commande
                    </Button>
                  </div>
                  {orderFormPDFRef.current ? (
                    <div style={{ height: 'calc(100% - 40px)' }}>
                      <PDFViewer style={{ width: '100%', height: '100%' }}>
                        {orderFormPDFRef.current}
                      </PDFViewer>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <Spin size="large" tip="Préparation du PDF..." />
                    </div>
                  )}
                </>
              )}
            </Modal>

            <CreateInvoiceFromDevis 
              devisId={params.id}
              isOpen={showCreateInvoiceModal}
              onClose={() => setShowCreateInvoiceModal(false)}
            />
            
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
                <ServiceForm
                  categoryId={selectedCategoryForService ? selectedCategoryForService : ''}
                  products={products}
                  onSubmit={(values) => {
                    console.log('Nouvelle prestation créée:', values);
                    
                    // Créer un objet newService compatible avec handleServiceCreated
                    const newService = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: values.name,
                      description: values.description,
                      price: values.price,
                      unit: values.unit || 'm²',
                      categoryName: 'Nouvelle prestation',
                      materials: values.materials.map(material => {
                        const product = products.find(p => p.id === material.productId);
                        return {
                          id: material.productId,
                          name: product?.name || 'Matériau',
                          quantity: material.quantity,
                          price: product?.sellingPrice || 0,
                          unit: product?.unit || 'u',
                          reference: product?.reference || ''
                        };
                      })
                    };
                    
                    handleServiceCreated(newService);
                  }}
                  isLoading={false}
                  onCloseParentModal={() => setIsServiceCreatorVisible(false)}
                  onUpdateProduct={async (product) => {
                    // Mettre à jour le produit dans la liste des produits
                    const updatedProducts = products.map(p => 
                      p.id === product.id ? product : p
                    );
                    setProducts(updatedProducts);
                    return product;
                  }}
                  initialValues={{ name: searchValue }} // Passer le texte recherché comme valeur initiale
                />
              </div>
            </Modal>

            {/* Modale pour sélectionner un catalogue et une catégorie */}
            <Modal
              title="Sélection du catalogue et de la catégorie"
              open={isCatalogSelectorVisible}
              onCancel={() => setIsCatalogSelectorVisible(false)}
              footer={null}
              width={600}
            >
              <div style={{ position: 'relative', minHeight: '300px' }}>
                <div className="catalog-selector" style={{ marginBottom: '16px' }}>
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
                    disabled={catalogs.length === 0 || isLoadingCatalog}
                  />
                  
                  {selectedCatalogId && (
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Sélectionner une catégorie"
                      onChange={(value) => setSelectedCategoryForService(value)}
                      options={catalogCategories.map(category => ({
                        value: category.id,
                        label: category.name
                      }))}
                      disabled={catalogCategories.length === 0 || isLoadingCatalog}
                      showSearch
                      optionFilterProp="label"
                      filterOption={(input, option) => 
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    />
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
          </Form>
        </Card>
      </div>
    </>
  );
} 
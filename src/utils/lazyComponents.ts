import { lazyLoad } from './lazyLoad';

// Composants lourds à charger paresseusement
export const LazyCatalogImporterNew = lazyLoad(
  () => import('../components/CatalogImporterNew'),
  { ssr: false }
);

export const LazyCatalogDetail = lazyLoad(
  () => import('../components/catalogs/CatalogDetail'),
  { ssr: false }
);

export const LazyDevisPDF = lazyLoad(
  () => import('../components/DevisPDF'),
  { ssr: false }
);

export const LazyInvoicePDF = lazyLoad(
  () => import('../components/InvoicePDF'),
  { ssr: false }
);

export const LazyDevisWithMaterialsPDF = lazyLoad(
  () => import('../components/DevisWithMaterialsPDF'),
  { ssr: false }
);

export const LazyInvoiceEditor = lazyLoad(
  () => import('../components/InvoiceEditor'),
  { ssr: false }
);

export const LazyCatalogItemVerification = lazyLoad(
  () => import('../components/CatalogItemVerification'),
  { ssr: false }
);

export const LazyMaterialImportVerification = lazyLoad(
  () => import('../components/MaterialImportVerification'),
  { ssr: false }
);

// Préchargement des composants fréquemment utilisés
export function preloadFrequentComponents() {
  import('../components/CatalogImporterNew');
  import('../components/catalogs/CatalogDetail');
} 
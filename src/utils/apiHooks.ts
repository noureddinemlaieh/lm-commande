import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';
import { memoize } from './performance';

// Fonction de récupération par défaut
const defaultFetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('Une erreur est survenue lors de la requête API');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  
  return response.json();
};

// Mémoisation du fetcher pour éviter les recréations inutiles
const memoizedFetcher = memoize(defaultFetcher);

// Configuration SWR par défaut
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};

/**
 * Hook personnalisé pour les requêtes GET avec mise en cache
 * @param url - URL de l'API
 * @param config - Configuration SWR
 * @returns Réponse SWR
 */
export function useApiGet<Data = any, Error = any>(
  url: string | null,
  config: SWRConfiguration = {}
): SWRResponse<Data, Error> {
  return useSWR<Data, Error>(
    url,
    memoizedFetcher,
    { ...defaultConfig, ...config }
  );
}

/**
 * Fonction pour les requêtes POST/PUT/DELETE
 */
async function sendRequest(url: string, { arg }: { arg: any }) {
  const { method = 'POST', body, headers = {} } = arg;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = new Error('Une erreur est survenue lors de la requête API');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }
  
  return response.json();
}

/**
 * Hook personnalisé pour les mutations (POST/PUT/DELETE)
 * @param url - URL de l'API
 * @param config - Configuration SWR Mutation
 * @returns Trigger et état de la mutation
 */
export function useApiMutation<Data = any, Error = any>(
  url: string,
  config: SWRMutationConfiguration = {}
) {
  return useSWRMutation<Data, Error, string, { method?: string; body: any; headers?: Record<string, string> }>(
    url,
    sendRequest,
    config
  );
}

/**
 * Hook pour la pagination côté serveur
 * @param baseUrl - URL de base de l'API
 * @param page - Numéro de page actuel
 * @param limit - Nombre d'éléments par page
 * @param filters - Filtres supplémentaires
 * @param config - Configuration SWR
 * @returns Données paginées et fonctions de navigation
 */
export function usePaginatedApi<Data = any, Error = any>(
  baseUrl: string,
  page: number = 1,
  limit: number = 10,
  filters: Record<string, any> = {},
  config: SWRConfiguration = {}
) {
  // Construire l'URL avec les paramètres de pagination et filtres
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>)
  });
  
  const url = `${baseUrl}?${queryParams.toString()}`;
  
  // Utiliser le hook useApiGet pour récupérer les données
  const { data, error, isLoading, isValidating, mutate } = useApiGet<Data, Error>(url, config);
  
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    page,
    limit,
    goToPage: (newPage: number) => {
      return { page: newPage, limit };
    },
    changeLimit: (newLimit: number) => {
      return { page: 1, limit: newLimit };
    }
  };
} 
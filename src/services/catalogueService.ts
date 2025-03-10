import { Catalogue } from '../types/catalogue';

export const getCatalogues = async (): Promise<Catalogue[]> => {
  try {
    const response = await fetch('/api/catalogues');
    console.log('API Response:', response);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('API Data:', data);
    return data;
  } catch (error) {
    console.error('Error in getCatalogues:', error);
    throw error;
  }
}; 
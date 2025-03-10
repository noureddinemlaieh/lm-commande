import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewDevisPage from '../page';
import { getNextDevisNumber } from '@/utils/devisSequence';
import { useRouter } from 'next/navigation';

// Mock des dépendances
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/utils/devisSequence', () => ({
  getNextDevisNumber: jest.fn()
}));

// Mock des données de test
const mockDevisNumber = {
  number: 1,
  year: 2024,
  reference: 'DEVIS-2024-0001'
};

const mockCatalogs = [{
  id: 'cat1',
  name: 'Catalogue Test',
  categories: [{
    name: 'Catégorie Test',
    services: [{
      id: 'service1',
      name: 'Service Test',
      price: 100,
      unit: 'm²'
    }]
  }]
}];

const mockContacts = [{
  id: 'contact1',
  name: 'Contact Test'
}];

describe('NewDevisPage', () => {
  beforeEach(() => {
    // Reset des mocks
    jest.clearAllMocks();
    
    // Setup des mocks
    (getNextDevisNumber as jest.Mock).mockResolvedValue(mockDevisNumber);
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/catalogs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCatalogs)
        });
      }
      if (url.includes('/api/contacts')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockContacts)
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('charge correctement les données initiales', async () => {
    render(<NewDevisPage />);

    // Vérifier le chargement du numéro de devis
    await waitFor(() => {
      expect(screen.getByText('DEVIS-2024-0001')).toBeInTheDocument();
    });

    // Vérifier le chargement des catalogues
    await waitFor(() => {
      expect(screen.getByText('Catalogue Test')).toBeInTheDocument();
    });

    // Vérifier le chargement des contacts
    await waitFor(() => {
      expect(screen.getByText('Contact Test')).toBeInTheDocument();
    });
  });

  it('permet d\'ajouter une section', async () => {
    render(<NewDevisPage />);

    const addSectionButton = screen.getByText('Ajouter Section');
    fireEvent.click(addSectionButton);

    await waitFor(() => {
      const sectionInput = screen.getByDisplayValue('Nouvelle section');
      expect(sectionInput).toBeInTheDocument();
    });
  });

  it('calcule correctement les totaux', async () => {
    render(<NewDevisPage />);

    // Ajouter une section
    fireEvent.click(screen.getByText('Ajouter Section'));

    // Sélectionner un catalogue
    const catalogSelect = screen.getByLabelText('Catalogue');
    fireEvent.change(catalogSelect, { target: { value: 'cat1' } });

    // Ajouter une prestation
    await waitFor(() => {
      const addPrestationSelect = screen.getByPlaceholderText('Ajouter une prestation...');
      fireEvent.change(addPrestationSelect, { target: { value: 'service1' } });
    });

    // Vérifier les totaux
    await waitFor(() => {
      expect(screen.getByText('100,00 €')).toBeInTheDocument();
    });
  });

  it('gère correctement le changement de TVA', async () => {
    render(<NewDevisPage />);

    // Ajouter une section et une prestation
    fireEvent.click(screen.getByText('Ajouter Section'));
    const catalogSelect = screen.getByLabelText('Catalogue');
    fireEvent.change(catalogSelect, { target: { value: 'cat1' } });

    // Changer le taux de TVA
    await waitFor(() => {
      const tvaSelect = screen.getByDisplayValue('20%');
      fireEvent.change(tvaSelect, { target: { value: '10' } });
    });

    // Vérifier le nouveau calcul de TVA
    await waitFor(() => {
      const tvaAmount = screen.getByText('10,00 €');
      expect(tvaAmount).toBeInTheDocument();
    });
  });

  it('sauvegarde correctement le devis', async () => {
    const mockRouter = {
      push: jest.fn()
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<NewDevisPage />);

    // Remplir les champs requis
    fireEvent.click(screen.getByText('Ajouter Section'));
    const contactSelect = screen.getByLabelText('Client');
    fireEvent.change(contactSelect, { target: { value: 'contact1' } });

    // Cliquer sur le bouton de sauvegarde
    const saveButton = screen.getByText('Créer');
    fireEvent.click(saveButton);

    // Vérifier la redirection
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/devis');
    });
  });
}); 
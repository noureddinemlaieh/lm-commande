import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types pour l'utilisateur et les permissions
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
}

// Valeurs par défaut du contexte
const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  hasPermission: () => false,
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(defaultContext);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    
    // Pour l'instant, on simule un utilisateur avec toutes les permissions
    return true;
    
    // Implémentation réelle :
    // return user.permissions.includes(permission);
  };

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Simuler un chargement d'utilisateur
        // Dans une implémentation réelle, vous feriez un appel API ici
        setTimeout(() => {
          setUser({
            id: '1',
            name: 'Utilisateur Test',
            email: 'test@example.com',
            role: 'admin',
            permissions: ['settings.numbering.edit', 'settings.numbering.view']
          });
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Erreur lors du chargement de l\'utilisateur');
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}; 
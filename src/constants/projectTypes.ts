export const PROJECT_TYPES = [
  { value: 'SALLE_DE_BAIN', label: 'Salle de bain' },
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'ELECTRICITE', label: 'Électricité' },
  { value: 'PLOMBERIE', label: 'Plomberie' },
  { value: 'CHAUFFAGE', label: 'Chauffage' },
  { value: 'RENOVATION', label: 'Rénovation' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'ISOLATION', label: 'Isolation' },
  { value: 'PEINTURE', label: 'Peinture' },
  { value: 'CARRELAGE', label: 'Carrelage' },
  { value: 'MENUISERIE', label: 'Menuiserie' },
  { value: 'AUTRE', label: 'Autre' }
];

export const getProjectTypeLabel = (value: string | null | undefined): string => {
  if (!value) return 'Autre';
  const projectType = PROJECT_TYPES.find(type => type.value === value);
  return projectType ? projectType.label : 'Autre';
}; 
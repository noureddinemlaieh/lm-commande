import { App } from 'antd';

// Fonction pour obtenir l'instance de message compatible avec React 19
export const useAntdMessage = () => {
  const { message } = App.useApp();
  return message;
};

// Pour les composants qui ne sont pas des hooks, utiliser cette fonction
// dans un composant parent qui utilise useAntdMessage et passer le message
// en tant que prop 
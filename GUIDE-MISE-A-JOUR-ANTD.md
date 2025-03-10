# Guide de mise à jour pour la compatibilité Ant Design v5 avec React 19

## Problème

Vous utilisez React 19 avec Ant Design v5, mais ces versions ne sont pas directement compatibles. Ant Design v5 est officiellement compatible avec React 16-18, mais nécessite un patch spécial pour fonctionner correctement avec React 19.

## Solution mise en place

1. Installation du patch de compatibilité :
   ```bash
   npm install @ant-design/v5-patch-for-react-19 --save --legacy-peer-deps
   ```

2. Création d'un fichier `src/app/react-patch.ts` pour importer le patch :
   ```typescript
   // Patch pour la compatibilité entre Ant Design v5 et React 19
   import '@ant-design/v5-patch-for-react-19';
   ```

3. Importation du patch dans `src/app/layout.tsx` :
   ```typescript
   import './react-patch';
   ```

## Modifications à apporter dans vos fichiers

Pour tous les fichiers qui utilisent directement `message` d'Ant Design, vous devez :

1. Remplacer :
   ```typescript
   import { message } from 'antd';
   ```
   Par :
   ```typescript
   import { App } from 'antd';
   ```

2. Dans le composant, ajouter :
   ```typescript
   const { message } = App.useApp();
   ```

3. Remplacer tous les appels directs comme `message.success()` par l'utilisation de l'instance obtenue via `App.useApp()`.

### Exemple de modification

Avant :
```typescript
import { message } from 'antd';

const MyComponent = () => {
  const handleClick = () => {
    message.success('Opération réussie');
  };
  
  return <Button onClick={handleClick}>Cliquer</Button>;
};
```

Après :
```typescript
import { App } from 'antd';

const MyComponent = () => {
  const { message } = App.useApp();
  
  const handleClick = () => {
    message.success('Opération réussie');
  };
  
  return <Button onClick={handleClick}>Cliquer</Button>;
};
```

## Fichiers à mettre à jour

Voici la liste des fichiers qui utilisent directement `message` et qui doivent être mis à jour :

1. src/context/AppContext.tsx
2. src/CatalogDetail.tsx
3. src/components/Devis.tsx
4. src/app/products/edit/[id]/page.tsx
5. src/app/products/new/page.tsx
6. src/app/devis/[id]/edit/page.tsx
7. src/app/devis/new/page.tsx
8. src/components/ExcelImporter.tsx
9. src/components/CreateInvoiceFromDevis.tsx
10. src/components/catalogs/CatalogActions.tsx
11. src/components/CatalogImporter.tsx
12. src/components/CatalogDetail.tsx
13. src/components/CatalogActions.tsx
14. src/components/catalog/MaterialSelector.tsx
15. src/app/settings/page.tsx
16. src/app/retention-guarantees/page.tsx
17. src/app/retention-guarantees/[id]/edit/page.tsx
18. src/app/prescribers/page.tsx
19. src/app/prescribers/[id]/edit/page.tsx
20. src/app/prescribers/new/page.tsx
21. src/app/invoices/page.tsx
22. src/app/invoices/[id]/edit/page.tsx
23. src/app/invoices/new/page.tsx
24. src/app/contacts/new/page.tsx
25. src/app/contacts/page.tsx
26. src/app/contacts/[id]/edit/page.tsx
27. src/app/catalog/page.tsx

## Utilitaire pour simplifier la transition

Nous avons créé un utilitaire pour faciliter l'utilisation de `message` dans les composants qui ne sont pas des hooks :

```typescript
// src/utils/antdMessage.ts
import { App } from 'antd';

// Fonction pour obtenir l'instance de message compatible avec React 19
export const useAntdMessage = () => {
  const { message } = App.useApp();
  return message;
};
```

Vous pouvez l'utiliser comme ceci :

```typescript
import { useAntdMessage } from '@/utils/antdMessage';

const MyComponent = () => {
  const message = useAntdMessage();
  
  const handleClick = () => {
    message.success('Opération réussie');
  };
  
  return <Button onClick={handleClick}>Cliquer</Button>;
};
```

## Redémarrage de l'application

Après avoir effectué ces modifications, redémarrez votre serveur de développement :

```bash
npm run dev
```

Si vous rencontrez encore des erreurs, essayez de nettoyer le cache de Next.js :

```bash
rm -rf .next
npm run dev
``` 
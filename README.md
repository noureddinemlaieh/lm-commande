# LM Commande

Application de gestion de devis et commandes pour LM Commande.

## Fonctionnalités

- Gestion des devis
- Gestion des clients
- Gestion des catalogues et produits
- Génération de PDF
- Interface utilisateur moderne avec Ant Design

## Technologies utilisées

- Next.js 14
- React
- TypeScript
- Prisma ORM
- PostgreSQL
- Ant Design
- Docker

## Installation

### Prérequis

- Node.js 18 ou supérieur
- npm 9 ou supérieur
- PostgreSQL (ou Docker pour l'environnement de développement)

### Installation des dépendances

```bash
npm install
```

### Configuration de l'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
DATABASE_URL="postgresql://user:password@localhost:5432/lm_commande_db?schema=public"
```

Remplacez `user`, `password` et les autres paramètres selon votre configuration.

### Initialisation de la base de données

```bash
npx prisma migrate dev
```

### Démarrage en mode développement

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

- `npm run dev` : Démarre l'application en mode développement
- `npm run build` : Construit l'application pour la production
- `npm run start` : Démarre l'application en mode production
- `npm run lint` : Vérifie le code avec ESLint
- `npm run db:migrate` : Exécute les migrations de base de données
- `npm run db:seed` : Initialise la base de données avec des données de test

## Déploiement

### Déploiement sur Vercel (Recommandé)

1. Créez un compte sur [Vercel](https://vercel.com) si vous n'en avez pas déjà un.

2. Installez l'interface de ligne de commande Vercel :
   ```bash
   npm install -g vercel
   ```

3. Connectez-vous à votre compte Vercel :
   ```bash
   vercel login
   ```

4. Déployez l'application :
   ```bash
   vercel
   ```

5. Pour les déploiements de production :
   ```bash
   vercel --prod
   ```

### Déploiement avec Docker

1. Construire l'image Docker
   ```bash
   docker build -t lm-commande .
   ```

2. Exécuter le conteneur
   ```bash
   docker-compose up -d
   ```

## Structure du projet

```
lm_commande/
├── prisma/              # Schéma et migrations Prisma
├── public/              # Fichiers statiques
├── src/
│   ├── app/             # Routes et pages Next.js
│   ├── components/      # Composants React réutilisables
│   ├── lib/             # Bibliothèques et utilitaires
│   ├── services/        # Services pour les API et la logique métier
│   └── types/           # Définitions de types TypeScript
├── .env                 # Variables d'environnement
├── .env.production      # Variables d'environnement pour la production
├── docker-compose.yml   # Configuration Docker Compose
├── Dockerfile           # Configuration Docker
└── next.config.js       # Configuration Next.js
```

## Contribution

1. Clonez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## Licence

Propriétaire - Tous droits réservés

## Contact

LM Commande - [contact@lmcommande.fr](mailto:contact@lmcommande.fr)

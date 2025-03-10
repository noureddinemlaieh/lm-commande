# Guide de déploiement de LM Commande

Ce document explique comment déployer l'application LM Commande en production.

## Prérequis

- Node.js 18 ou supérieur
- npm 9 ou supérieur
- Docker et Docker Compose
- Une base de données PostgreSQL

## Méthode 1 : Déploiement avec Docker (recommandé)

### Étape 1 : Configuration de l'environnement

1. Créez un fichier `.env.production` à la racine du projet avec les variables d'environnement nécessaires :

```
DATABASE_URL="postgresql://user:password@db:5432/lm_commande_db?schema=public"
NEXT_PUBLIC_API_URL=https://votre-domaine-de-production.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

Remplacez les valeurs par celles correspondant à votre environnement de production.

### Étape 2 : Déploiement avec Docker Compose

1. Exécutez le script de déploiement :

```bash
chmod +x deploy.sh
./deploy.sh
```

Ce script va :
- Copier `.env.production` vers `.env`
- Construire les images Docker
- Arrêter les conteneurs existants
- Démarrer les nouveaux conteneurs
- Exécuter les migrations de base de données

### Étape 3 : Vérification

1. Vérifiez que l'application fonctionne en accédant à `http://votre-serveur:3000`
2. Vérifiez les logs avec `docker-compose logs -f app`

## Méthode 2 : Déploiement manuel

### Étape 1 : Installation des dépendances

```bash
npm ci
```

### Étape 2 : Construction de l'application

```bash
npm run production:build
```

### Étape 3 : Démarrage de l'application

```bash
npm run production:start
```

## Migrations de base de données

Pour exécuter les migrations de base de données :

```bash
npm run db:migrate
```

Pour initialiser la base de données avec des données de test :

```bash
npm run db:seed
```

## Dépannage

### Problèmes de connexion à la base de données

Vérifiez que :
- L'URL de la base de données est correcte dans `.env.production`
- La base de données est accessible depuis le conteneur Docker
- Les migrations ont été exécutées

### Problèmes de build

Si vous rencontrez des problèmes lors du build :

1. Supprimez le dossier `.next` : `rm -rf .next`
2. Supprimez le dossier `node_modules` : `rm -rf node_modules`
3. Réinstallez les dépendances : `npm ci`
4. Reconstruisez l'application : `npm run build`

## Sécurité

- Assurez-vous que votre serveur est protégé par un pare-feu
- Utilisez HTTPS pour sécuriser les communications
- Ne partagez pas vos variables d'environnement
- Changez régulièrement les mots de passe de la base de données

## Maintenance

- Effectuez des sauvegardes régulières de la base de données
- Mettez à jour régulièrement les dépendances avec `npm update`
- Surveillez les logs pour détecter d'éventuels problèmes 
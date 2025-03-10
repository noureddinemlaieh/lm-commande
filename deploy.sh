#!/bin/bash

# Script de déploiement pour l'application LM Commande

# Afficher un message de bienvenue
echo "=== Script de déploiement pour LM Commande ==="
echo "Ce script va déployer l'application en production."
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Demander confirmation avant de continuer
read -p "Voulez-vous continuer avec le déploiement ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé."
    exit 0
fi

# Vérifier si le fichier .env.production existe
if [ ! -f .env.production ]; then
    echo "Le fichier .env.production n'existe pas. Veuillez le créer avant de continuer."
    exit 1
fi

# Copier .env.production vers .env pour Docker Compose
echo "Copie de .env.production vers .env..."
cp .env.production .env

# Construire les images Docker
echo "Construction des images Docker..."
docker-compose build

# Arrêter les conteneurs existants
echo "Arrêt des conteneurs existants..."
docker-compose down

# Démarrer les nouveaux conteneurs
echo "Démarrage des nouveaux conteneurs..."
docker-compose up -d

# Exécuter les migrations de base de données
echo "Exécution des migrations de base de données..."
docker-compose exec app npx prisma migrate deploy

# Afficher les logs pour vérifier que tout fonctionne
echo "Affichage des logs de l'application..."
docker-compose logs -f app

echo "Déploiement terminé avec succès !" 
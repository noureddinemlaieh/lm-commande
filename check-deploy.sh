#!/bin/bash

# Script de vérification avant déploiement pour LM Commande
echo "=== Vérification de l'environnement de déploiement pour LM Commande ==="
echo ""

# Vérification de Node.js
echo "Vérification de Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js est installé: $NODE_VERSION"
    
    # Vérifier la version de Node.js
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        echo "⚠️ AVERTISSEMENT: La version de Node.js est inférieure à 18. Il est recommandé d'utiliser Node.js 18 ou supérieur."
    fi
else
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18 ou supérieur."
    exit 1
fi

# Vérification de npm
echo "Vérification de npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm est installé: $NPM_VERSION"
else
    echo "❌ npm n'est pas installé. Veuillez installer npm 9 ou supérieur."
    exit 1
fi

# Vérification de Docker
echo "Vérification de Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker est installé: $DOCKER_VERSION"
else
    echo "❌ Docker n'est pas installé. Docker est nécessaire pour le déploiement."
    exit 1
fi

# Vérification de Docker Compose
echo "Vérification de Docker Compose..."
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(docker-compose --version)
    echo "✅ Docker Compose est installé: $DOCKER_COMPOSE_VERSION"
else
    echo "❌ Docker Compose n'est pas installé. Docker Compose est nécessaire pour le déploiement."
    exit 1
fi

# Vérification des fichiers nécessaires
echo "Vérification des fichiers nécessaires..."
FILES_TO_CHECK=("package.json" "next.config.js" "prisma/schema.prisma" "Dockerfile" "docker-compose.yml" ".env.production")
MISSING_FILES=0

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file est manquant"
        MISSING_FILES=$((MISSING_FILES+1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo "⚠️ AVERTISSEMENT: $MISSING_FILES fichier(s) nécessaire(s) manquant(s). Veuillez les créer avant le déploiement."
else
    echo "✅ Tous les fichiers nécessaires sont présents."
fi

# Vérification des variables d'environnement
echo "Vérification des variables d'environnement..."
if [ -f ".env.production" ]; then
    if grep -q "DATABASE_URL" .env.production; then
        echo "✅ Variable DATABASE_URL trouvée dans .env.production"
    else
        echo "❌ Variable DATABASE_URL manquante dans .env.production"
    fi
    
    if grep -q "NODE_ENV=production" .env.production; then
        echo "✅ Variable NODE_ENV=production trouvée dans .env.production"
    else
        echo "⚠️ AVERTISSEMENT: NODE_ENV=production manquante dans .env.production"
    fi
else
    echo "❌ Fichier .env.production manquant"
fi

# Vérification des dépendances
echo "Vérification des dépendances..."
if [ -d "node_modules" ]; then
    echo "✅ Dépendances installées (dossier node_modules existe)"
else
    echo "⚠️ AVERTISSEMENT: Dépendances non installées (dossier node_modules manquant)"
fi

# Vérification de la configuration Docker
echo "Vérification de la configuration Docker..."
if [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ]; then
    echo "✅ Configuration Docker complète"
else
    echo "❌ Configuration Docker incomplète"
fi

# Résumé
echo ""
echo "=== Résumé de la vérification ==="
if [ $MISSING_FILES -gt 0 ]; then
    echo "⚠️ $MISSING_FILES fichier(s) nécessaire(s) manquant(s)"
else
    echo "✅ Tous les fichiers nécessaires sont présents"
fi

if [ ! -f ".env.production" ] || ! grep -q "DATABASE_URL" .env.production; then
    echo "❌ Configuration d'environnement incomplète"
else
    echo "✅ Configuration d'environnement complète"
fi

if [ ! -f "Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
    echo "❌ Configuration Docker incomplète"
else
    echo "✅ Configuration Docker complète"
fi

echo ""
if [ $MISSING_FILES -eq 0 ] && [ -f ".env.production" ] && grep -q "DATABASE_URL" .env.production && [ -f "Dockerfile" ] && [ -f "docker-compose.yml" ]; then
    echo "✅ PRÊT POUR LE DÉPLOIEMENT"
    echo "Vous pouvez maintenant exécuter ./deploy.sh pour déployer l'application"
else
    echo "❌ NON PRÊT POUR LE DÉPLOIEMENT"
    echo "Veuillez corriger les problèmes ci-dessus avant de déployer l'application"
fi 
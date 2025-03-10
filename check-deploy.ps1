# Script de vérification avant déploiement pour LM Commande (PowerShell)
Write-Host "=== Vérification de l'environnement de déploiement pour LM Commande ===" -ForegroundColor Cyan
Write-Host ""

# Vérification de Node.js
Write-Host "Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js est installé: $nodeVersion" -ForegroundColor Green
    
    # Vérifier la version de Node.js
    $nodeMajorVersion = $nodeVersion -replace "v", "" -split "\." | Select-Object -First 1
    if ([int]$nodeMajorVersion -lt 18) {
        Write-Host "⚠️ AVERTISSEMENT: La version de Node.js est inférieure à 18. Il est recommandé d'utiliser Node.js 18 ou supérieur." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js n'est pas installé. Veuillez installer Node.js 18 ou supérieur." -ForegroundColor Red
    exit 1
}

# Vérification de npm
Write-Host "Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm est installé: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm n'est pas installé. Veuillez installer npm 9 ou supérieur." -ForegroundColor Red
    exit 1
}

# Vérification de Docker
Write-Host "Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker est installé: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas installé. Docker est nécessaire pour le déploiement." -ForegroundColor Red
    exit 1
}

# Vérification de Docker Compose
Write-Host "Vérification de Docker Compose..." -ForegroundColor Yellow
try {
    $dockerComposeVersion = docker-compose --version
    Write-Host "✅ Docker Compose est installé: $dockerComposeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose n'est pas installé. Docker Compose est nécessaire pour le déploiement." -ForegroundColor Red
    exit 1
}

# Vérification des fichiers nécessaires
Write-Host "Vérification des fichiers nécessaires..." -ForegroundColor Yellow
$filesToCheck = @("package.json", "next.config.js", "prisma\schema.prisma", "Dockerfile", "docker-compose.yml", ".env.production")
$missingFiles = 0

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file est manquant" -ForegroundColor Red
        $missingFiles++
    }
}

if ($missingFiles -gt 0) {
    Write-Host "⚠️ AVERTISSEMENT: $missingFiles fichier(s) nécessaire(s) manquant(s). Veuillez les créer avant le déploiement." -ForegroundColor Yellow
} else {
    Write-Host "✅ Tous les fichiers nécessaires sont présents." -ForegroundColor Green
}

# Vérification des variables d'environnement
Write-Host "Vérification des variables d'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "✅ Variable DATABASE_URL trouvée dans .env.production" -ForegroundColor Green
    } else {
        Write-Host "❌ Variable DATABASE_URL manquante dans .env.production" -ForegroundColor Red
    }
    
    if ($envContent -match "NODE_ENV=production") {
        Write-Host "✅ Variable NODE_ENV=production trouvée dans .env.production" -ForegroundColor Green
    } else {
        Write-Host "⚠️ AVERTISSEMENT: NODE_ENV=production manquante dans .env.production" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Fichier .env.production manquant" -ForegroundColor Red
}

# Vérification des dépendances
Write-Host "Vérification des dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Dépendances installées (dossier node_modules existe)" -ForegroundColor Green
} else {
    Write-Host "⚠️ AVERTISSEMENT: Dépendances non installées (dossier node_modules manquant)" -ForegroundColor Yellow
}

# Vérification de la configuration Docker
Write-Host "Vérification de la configuration Docker..." -ForegroundColor Yellow
if ((Test-Path "Dockerfile") -and (Test-Path "docker-compose.yml")) {
    Write-Host "✅ Configuration Docker complète" -ForegroundColor Green
} else {
    Write-Host "❌ Configuration Docker incomplète" -ForegroundColor Red
}

# Résumé
Write-Host ""
Write-Host "=== Résumé de la vérification ===" -ForegroundColor Cyan
if ($missingFiles -gt 0) {
    Write-Host "⚠️ $missingFiles fichier(s) nécessaire(s) manquant(s)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Tous les fichiers nécessaires sont présents" -ForegroundColor Green
}

if (-not (Test-Path ".env.production") -or -not ((Get-Content ".env.production" -Raw) -match "DATABASE_URL")) {
    Write-Host "❌ Configuration d'environnement incomplète" -ForegroundColor Red
} else {
    Write-Host "✅ Configuration d'environnement complète" -ForegroundColor Green
}

if (-not (Test-Path "Dockerfile") -or -not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Configuration Docker incomplète" -ForegroundColor Red
} else {
    Write-Host "✅ Configuration Docker complète" -ForegroundColor Green
}

Write-Host ""
if ($missingFiles -eq 0 -and (Test-Path ".env.production") -and ((Get-Content ".env.production" -Raw) -match "DATABASE_URL") -and (Test-Path "Dockerfile") -and (Test-Path "docker-compose.yml")) {
    Write-Host "✅ PRÊT POUR LE DÉPLOIEMENT" -ForegroundColor Green
    Write-Host "Vous pouvez maintenant exécuter .\deploy.ps1 pour déployer l'application" -ForegroundColor Cyan
} else {
    Write-Host "❌ NON PRÊT POUR LE DÉPLOIEMENT" -ForegroundColor Red
    Write-Host "Veuillez corriger les problèmes ci-dessus avant de déployer l'application" -ForegroundColor Yellow
} 
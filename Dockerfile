# Utiliser l'image Node.js officielle comme base
FROM node:18-alpine AS base

# Installer les dépendances nécessaires pour Prisma et autres packages
RUN apk add --no-cache libc6-compat openssl1.1-compat

# Définir le répertoire de travail
WORKDIR /app

# Étape de dépendances
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Étape de build
FROM base AS builder
WORKDIR /app

# Copier les dépendances de l'étape précédente
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer les types Prisma et construire l'application
RUN npx prisma generate
RUN npm run build

# Étape de production
FROM base AS runner
WORKDIR /app

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour exécuter l'application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copier les fichiers nécessaires de l'étape de build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Exposer le port sur lequel l'application s'exécute
EXPOSE 3000

# Définir la commande pour démarrer l'application
CMD ["node", "server.js"] 
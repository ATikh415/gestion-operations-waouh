# =====================================================
# Stage 1: Base - Image Node.js 24 Alpine
# =====================================================
FROM node:24-alpine AS base

# Installation des dépendances système nécessaires
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    bash

WORKDIR /app

# =====================================================
# Stage 2: Dependencies - Installation des node_modules
# =====================================================
FROM base AS deps

# Copie des fichiers de dépendances
COPY package.json package-lock.json ./

# Copie Prisma pour générer le client
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Installation de TOUTES les dépendances (y compris dev pour Prisma CLI)
RUN npm ci

# Génération du Prisma Client
RUN npx prisma generate

# =====================================================
# Stage 3: Builder - Build de l'application Next.js
# =====================================================
FROM base AS builder

WORKDIR /app

# Copie des node_modules depuis deps
COPY --from=deps /app/node_modules ./node_modules

# Copie de tout le code source
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build de Next.js
RUN npm run build

# =====================================================
# Stage 4: Runner - Image de production finale
# =====================================================
FROM base AS runner

WORKDIR /app

# Configuration de l'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Création d'un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copie des fichiers Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ✅ CORRECTION : Copier TOUT node_modules (pas juste Prisma)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copie des fichiers Prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Script de démarrage
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

# Permissions
RUN chmod +x docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Utilisation de l'utilisateur non-root
USER nextjs

# Exposition du port
EXPOSE 3000

# Commande de démarrage
ENTRYPOINT ["/app/docker-entrypoint.sh"]
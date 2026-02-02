#!/bin/bash
set -e

echo "🚀 Starting Gestion Achats Application..."

# Vérification de la connexion à la base de données
echo "📊 Checking database connection..."
npx prisma db push --skip-generate 2>/dev/null || echo "⚠️  Database push failed, will retry on migration"

# Exécution des migrations Prisma
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Démarrage de l'application
echo "✅ Starting Next.js server..."
exec node server.js
#!/bin/bash
set -e

echo "🚀 Starting Gestion Achats Application (Prisma 7)"
echo "=================================================="

# ========================================
# Vérification des Variables d'Environnement
# ========================================
echo ""
echo "🔍 Checking environment variables..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Support NextAuth v5
if [ -n "$AUTH_URL" ]; then
  export NEXTAUTH_URL="$AUTH_URL"
  echo "✅ AUTH_URL: $AUTH_URL (mapped to NEXTAUTH_URL)"
fi

if [ -n "$AUTH_SECRET" ]; then
  export NEXTAUTH_SECRET="$AUTH_SECRET"
  echo "✅ AUTH_SECRET: configured (mapped to NEXTAUTH_SECRET)"
fi

echo "✅ NODE_ENV: ${NODE_ENV}"

# Exporter toutes les variables
export DATABASE_URL="${DATABASE_URL}"
export NODE_ENV="${NODE_ENV:-production}"

echo ""
echo "📋 Environment variables exported"

# ========================================
# Test de Connexion PostgreSQL
# ========================================
echo ""
echo "📊 Testing PostgreSQL connection..."

MAX_RETRIES=30
RETRY_COUNT=0

# ✅ Utiliser le chemin complet vers prisma
PRISMA_CMD="./node_modules/.bin/prisma"

# Vérifier que Prisma existe
if [ ! -f "$PRISMA_CMD" ]; then
  echo "❌ Prisma CLI not found at $PRISMA_CMD"
  echo "Checking node_modules structure:"
  ls -la node_modules/.bin/ | head -20
  exit 1
fi

until $PRISMA_CMD db execute --stdin <<SQL 2>/dev/null
SELECT 1;
SQL
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Failed to connect to PostgreSQL after $MAX_RETRIES attempts"
    exit 1
  fi
  
  echo "⏳ Waiting for PostgreSQL... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ PostgreSQL connection successful!"

# ========================================
# Génération du Prisma Client
# ========================================
echo ""
echo "🔧 Generating Prisma Client..."
$PRISMA_CMD generate

echo "✅ Prisma Client generated"

# ========================================
# Exécution des Migrations Prisma
# ========================================
echo ""
echo "🔄 Running Prisma migrations..."

if $PRISMA_CMD migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Migrations may already be applied"
fi

# ========================================
# Démarrage de l'Application
# ========================================
echo ""
echo "=================================================="
echo "✅ Starting Next.js server on port 3000..."
echo "=================================================="
echo ""

exec node server.js
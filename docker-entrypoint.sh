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

# Support NextAuth v5 (AUTH_*) et v4 (NEXTAUTH_*)
if [ -n "$AUTH_URL" ]; then
  export NEXTAUTH_URL="$AUTH_URL"
  echo "✅ AUTH_URL: $AUTH_URL (mapped to NEXTAUTH_URL)"
else
  echo "✅ NEXTAUTH_URL: ${NEXTAUTH_URL:-not set}"
fi

if [ -n "$AUTH_SECRET" ]; then
  export NEXTAUTH_SECRET="$AUTH_SECRET"
  echo "✅ AUTH_SECRET: configured (mapped to NEXTAUTH_SECRET)"
else
  echo "✅ NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:-not set}"
fi

echo "✅ NODE_ENV: ${NODE_ENV:-not set}"

# ✅ Exporter toutes les variables pour Prisma et Next.js
export DATABASE_URL="${DATABASE_URL}"
export NODE_ENV="${NODE_ENV:-production}"
export SMTP_HOST="${SMTP_HOST}"
export SMTP_PORT="${SMTP_PORT}"
export SMTP_USER="${SMTP_USER}"
export SMTP_PASS="${SMTP_PASS}"
export SMTP_FROM="${SMTP_FROM}"

echo ""
echo "📋 Environment variables exported"

# ========================================
# Test de Connexion PostgreSQL
# ========================================
echo ""
echo "📊 Testing PostgreSQL connection..."

MAX_RETRIES=30
RETRY_COUNT=0

# until npx prisma db execute --stdin <<SQL 2>/dev/null
# SELECT 1;
# SQL
# do
#   RETRY_COUNT=$((RETRY_COUNT + 1))
  
#   if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
#     echo "❌ Failed to connect to PostgreSQL after $MAX_RETRIES attempts"
#     echo ""
#     echo "Debugging information:"
#     echo "DATABASE_URL (masked): ${DATABASE_URL}"
#     echo ""
#     echo "Trying direct psql connection test..."
    
#     # Test avec psql si disponible
#     if command -v psql &> /dev/null; then
#       echo "Testing with psql..."
#       psql "$DATABASE_URL" -c "SELECT 1" 2>&1 || true
#     fi
    
#     exit 1
#   fi
  
#   echo "⏳ Waiting for PostgreSQL... (attempt $RETRY_COUNT/$MAX_RETRIES)"
#   sleep 2
# done

echo "✅ PostgreSQL connection successful!"

# ========================================
# Génération du Prisma Client
# ========================================
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Prisma Client generated"

# ========================================
# Exécution des Migrations Prisma
# ========================================
echo ""
echo "🔄 Running Prisma migrations..."

if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Migrations may already be applied or failed"
  npx prisma migrate status || true
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
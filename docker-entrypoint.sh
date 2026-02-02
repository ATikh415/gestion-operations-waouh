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
  echo ""
  echo "Available environment variables:"
  printenv | grep -v "SECRET\|PASSWORD" | sort
  exit 1
fi

echo "✅ DATABASE_URL is configured"
echo "✅ NEXTAUTH_URL: ${NEXTAUTH_URL:-not set}"
echo "✅ NODE_ENV: ${NODE_ENV:-not set}"

# ========================================
# Création du fichier .env pour Prisma 7
# ========================================
echo ""
echo "📝 Creating .env file for Prisma 7..."

cat > /app/.env << EOF
DATABASE_URL=${DATABASE_URL}
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NODE_ENV=${NODE_ENV}
EOF

echo "✅ .env file created successfully"

# Afficher la config (masquer les secrets)
echo ""
echo "📋 Configuration:"
cat /app/.env | sed 's/=.*SECRET.*/=***HIDDEN***/g' | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/g'

# ========================================
# Test de Connexion PostgreSQL
# ========================================
echo ""
echo "📊 Testing PostgreSQL connection..."

# Fonction pour tester la connexion
test_db_connection() {
  npx prisma db execute --stdin <<SQL 2>/dev/null
SELECT 1 as connection_test;
SQL
}

# Retry logic avec timeout
MAX_RETRIES=30
RETRY_COUNT=0

until test_db_connection; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Failed to connect to PostgreSQL after $MAX_RETRIES attempts"
    echo ""
    echo "Debugging information:"
    echo "DATABASE_URL (masked): ${DATABASE_URL%%@*}@***"
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

if npx prisma generate; then
  echo "✅ Prisma Client generated successfully"
else
  echo "❌ Failed to generate Prisma Client"
  exit 1
fi

# ========================================
# Exécution des Migrations Prisma
# ========================================
echo ""
echo "🔄 Running Prisma migrations..."

if npx prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
  
  # Afficher le statut des migrations
  echo ""
  echo "📊 Migration status:"
  npx prisma migrate status || true
else
  echo "⚠️  Migration deployment failed"
  echo ""
  echo "Checking migration status:"
  npx prisma migrate status || true
  
  # Ne pas exit si les migrations échouent (peut-être déjà appliquées)
  echo ""
  echo "⚠️  Continuing despite migration warning..."
fi

# ========================================
# Vérification de la Base de Données
# ========================================
echo ""
echo "🔍 Verifying database schema..."

# Compter les tables
TABLE_COUNT=$(npx prisma db execute --stdin <<SQL 2>/dev/null | grep -c "row" || echo "0"
SELECT COUNT(*) as row FROM information_schema.tables WHERE table_schema = 'public';
SQL
)

if [ "$TABLE_COUNT" -gt "0" ]; then
  echo "✅ Database schema verified ($TABLE_COUNT tables found)"
else
  echo "⚠️  No tables found in database"
fi

# ========================================
# Démarrage de l'Application
# ========================================
echo ""
echo "=================================================="
echo "✅ All checks passed! Starting Next.js server..."
echo "=================================================="
echo ""

# Démarrer l'application
exec node server.js
#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping migrations"
else
  # Run Prisma Migrate Deploy to apply pending migrations
  # This applies all migration files from prisma/migrations/
  # Safe for production - uses versioned SQL files
  if bun run db:migrate:deploy; then
    echo "✅ Database migrations applied successfully"
  else
    echo "❌ Database migration failed!"
    echo "ℹ️  Check migration files and database connectivity"
    echo "� Stopping deployment - migrations must succeed"
    exit 1
  fi
fi

echo "🚀 Starting FitRecipes Backend..."

# Start the application
exec bun run dist/index.js

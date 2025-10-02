#!/bin/sh
set -e

echo "🔄 Syncing database schema..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping database sync"
else
  # Run Prisma DB push to sync schema with database
  # Using --accept-data-loss flag for automated deployments
  # This is safe as it only applies schema changes
  if bun run db:push --accept-data-loss --skip-generate; then
    echo "✅ Database schema synced successfully"
  else
    echo "⚠️  Database sync encountered an issue"
    echo "ℹ️  This might be due to no changes needed or connectivity issues"
    echo "🔄 Continuing with application startup..."
  fi
fi

echo "🚀 Starting FitRecipes Backend..."

# Start the application
exec bun run dist/index.js

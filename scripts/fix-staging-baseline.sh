#!/bin/bash
# Quick Fix Script for Staging Migration Baseline Issue
# Run this script to baseline your staging database

set -e  # Exit on error

echo "🔧 Fixing Staging Migration Baseline..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    echo ""
    echo "📋 To fix this:"
    echo "1. Go to Render Dashboard > Your Staging Service > Environment"
    echo "2. Copy the DIRECT_URL value (NOT DATABASE_URL)"
    echo "3. Run: export DATABASE_URL='paste_your_direct_url_here'"
    echo "4. Then run this script again"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Show current migration status
echo "📊 Current migration status:"
bunx prisma migrate status || true
echo ""

# Baseline the migration
echo "🔄 Baselining initial migration..."
bunx prisma migrate resolve --applied "20251002145615_initial_schema"
echo ""

# Verify the fix
echo "✅ Verification:"
bunx prisma migrate status
echo ""

echo "🎉 Done! Your staging database is now baselined."
echo ""
echo "📝 Next steps:"
echo "1. Push any change to trigger redeployment:"
echo "   git commit --allow-empty -m 'chore: trigger staging redeploy after baseline'"
echo "   git push origin develop"
echo ""
echo "2. Watch Render logs - deployment should succeed now!"

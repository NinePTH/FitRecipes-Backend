# Fix Staging Migration Baseline Issue

## 🚨 Problem

**Error**: `P3005 - The database schema is not empty`

**Cause**: The staging database has tables created by `prisma db push`, but Prisma's `_prisma_migrations` table doesn't have a record of the initial migration. This happens when you switch from `db push` to `migrate deploy` on an existing database.

## ✅ Solution: Baseline the Database

Baselining tells Prisma "these tables already exist, mark the migration as applied without actually running it."

### Step 1: Connect to Staging Database

```bash
# Use the DIRECT_URL (not DATABASE_URL with pgbouncer)
# Get this from Render environment variables or Supabase dashboard
export DATABASE_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres?schema=public"
```

### Step 2: Baseline the Migration

This command marks the migration as applied WITHOUT running the SQL:

```bash
# Run this locally with staging database URL
bunx prisma migrate resolve --applied "20251002145615_initial_schema"
```

**What this does**:
1. Creates/updates the `_prisma_migrations` table
2. Adds a record saying "initial_schema migration is already applied"
3. Does NOT run the migration SQL (tables already exist)
4. Next deployment will see migration as complete and skip it

### Step 3: Verify Baseline

```bash
# Check migration status
bunx prisma migrate status
```

**Expected output**:
```
Database schema is up to date!
```

### Step 4: Deploy Again

Now push any change to `develop` branch to trigger redeployment:

```bash
git commit --allow-empty -m "chore: trigger staging redeploy after baseline"
git push origin develop
```

The deployment should now succeed because Prisma sees the migration as already applied.

## 🔄 Alternative: Reset and Migrate (DESTRUCTIVE)

**⚠️ WARNING**: This deletes all data! Only use if staging data is not important.

### Option A: Using Supabase Dashboard

1. Go to Supabase Dashboard > SQL Editor
2. Run this to drop all tables:

```sql
-- Drop all tables (including _prisma_migrations)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

3. Next deployment will create fresh schema with migration history

### Option B: Using Prisma (Requires direct database access)

```bash
# Reset database (drops all tables)
bunx prisma migrate reset --force

# This will:
# 1. Drop all tables
# 2. Create fresh schema
# 3. Apply all migrations
# 4. Run seed scripts (if any)
```

## 📋 Future Prevention

### For New Environments

When setting up a new environment (staging, production), always use migrations from the start:

```bash
# ✅ CORRECT: Use migrations
bun run db:migrate:deploy

# ❌ WRONG: Don't use db push in production/staging
bun run db:push
```

### Migration Workflow

1. **Development**: `prisma migrate dev --name description`
2. **Commit**: `git add prisma/migrations/ && git commit`
3. **Deploy**: Automatic via `prisma migrate deploy` in docker-entrypoint.sh

## 🔍 Understanding the Error

```
Error: P3005
The database schema is not empty.
```

**Translation**: Prisma found existing tables but no migration history in `_prisma_migrations` table.

**Why it happens**:
- You used `prisma db push` initially (creates tables, no history)
- Then switched to `prisma migrate deploy` (expects migration history)
- Mismatch between actual schema and recorded migrations

**The fix**: Tell Prisma the migration is "already applied" via baseline command.

## ✅ Verification Steps

After baselining, verify everything is correct:

```bash
# 1. Check migration status
bunx prisma migrate status
# Should show: "Database schema is up to date!"

# 2. Check database has migration table
psql $DATABASE_URL -c "SELECT migration_name, finished_at FROM _prisma_migrations;"
# Should show: 20251002145615_initial_schema | [timestamp]

# 3. Verify schema matches
bunx prisma db pull
# Should show no changes needed
```

## 🎯 Quick Fix Command

If you just want to fix it quickly:

```bash
# 1. Set staging database URL (get from Render)
export DATABASE_URL="your_staging_direct_url"

# 2. Baseline the migration
bunx prisma migrate resolve --applied "20251002145615_initial_schema"

# 3. Verify
bunx prisma migrate status

# 4. Trigger redeploy
git commit --allow-empty -m "chore: trigger redeploy after baseline"
git push origin develop
```

## 📚 More Information

- [Prisma Migrate Baseline Guide](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baseline-your-production-environment)
- [Prisma Migrate Resolve Command](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)
- [Production Troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

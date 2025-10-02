# Using Prisma Migrations - Complete Guide

## 🎯 Why Migrations > DB Push

Your deployment now uses **Prisma Migrate** instead of `db:push`. Here's why this is better:

### ❌ **db:push** (Old Way)
```
Schema changes → Apply directly to DB
```
- No history tracking
- Can lose data
- No rollback
- Not production-safe

### ✅ **migrate** (Current Way)
```
Schema changes → Create migration file → Review SQL → Apply to DB
```
- Full history in git
- Reviewed SQL files
- Can rollback
- Production-safe
- Team-friendly

## 📋 Current Setup

### **Deployment Process:**
```
1. Push code to develop/main
   ↓
2. GitHub Actions: Test & Build
   ↓
3. Render: Build Docker image
   ↓
4. Container starts → docker-entrypoint.sh
   ↓
5. Runs: bun run db:migrate:deploy
   - Applies pending migrations from prisma/migrations/
   - Updates _prisma_migrations table
   - Fails deployment if migrations fail (safe!)
   ↓
6. Application starts with updated database
```

### **Migration Files Location:**
```
prisma/
├── migrations/
│   ├── 20251002145615_initial_schema/
│   │   └── migration.sql          # Your initial database schema
│   └── migration_lock.toml         # Ensures consistency
└── schema.prisma                   # Your Prisma schema
```

## 🔄 How to Make Schema Changes

### **Step 1: Update Prisma Schema**

Edit `prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // Add new field:
  avatar    String?  // New field
  createdAt DateTime @default(now())
}
```

### **Step 2: Create Migration (Development)**

```bash
# Create a migration with a descriptive name
bun run db:migrate -- --name add_user_avatar

# This will:
# 1. Generate SQL migration file
# 2. Apply it to your local database
# 3. Regenerate Prisma Client
```

### **Step 3: Review Generated SQL**

Check the generated migration file:
```
prisma/migrations/20251002150000_add_user_avatar/migration.sql
```

Example content:
```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar" TEXT;
```

**Important**: Review this SQL to ensure it's safe!

### **Step 4: Commit and Push**

```bash
# Add migration files to git
git add prisma/migrations/
git add prisma/schema.prisma

# Commit with clear message
git commit -m "feat: add avatar field to User model"

# Push to develop (staging) first
git push origin develop
```

### **Step 5: Deployment Happens Automatically**

```
GitHub Actions → Tests → Build → Render
                                    ↓
                    docker-entrypoint.sh runs
                                    ↓
                    bun run db:migrate:deploy
                                    ↓
                    Applies: 20251002150000_add_user_avatar
                                    ↓
                    Database updated ✅
```

## 📊 Migration Commands Reference

### **Development (Local)**

```bash
# Create and apply a new migration
bun run db:migrate -- --name migration_name

# Reset database (DANGEROUS - deletes all data)
bun run db:reset

# View migration status
bunx prisma migrate status
```

### **Production (Automated)**

```bash
# Apply pending migrations (used in docker-entrypoint.sh)
bun run db:migrate:deploy

# This command:
# - Applies migrations that haven't been applied yet
# - Updates _prisma_migrations table
# - Never creates new migrations (production-safe)
# - Exits with error if migration fails
```

## 🔍 Migration Workflow Examples

### **Example 1: Add New Table**

1. **Update schema**:
```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  createdAt DateTime @default(now())
  
  user   User   @relation(fields: [userId], references: [id])
  recipe Recipe @relation(fields: [recipeId], references: [id])
  
  @@unique([userId, recipeId])
}
```

2. **Create migration**:
```bash
bun run db:migrate -- --name add_favorites_table
```

3. **Review SQL**:
```sql
-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_recipeId_key" ON "favorites"("userId", "recipeId");
-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

4. **Commit & Push**:
```bash
git add prisma/
git commit -m "feat: add favorites functionality"
git push origin develop  # Test on staging first!
```

### **Example 2: Modify Existing Column**

1. **Update schema**:
```prisma
model Recipe {
  title       String   @db.VarChar(200)  // Changed from default
  // ... other fields
}
```

2. **Create migration**:
```bash
bun run db:migrate -- --name update_recipe_title_length
```

3. **Review SQL** (might truncate data!):
```sql
-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "title" SET DATA TYPE VARCHAR(200);
```

4. **Test locally first!**:
```bash
# Check if any existing data will be affected
# Test with your local database
bun run db:migrate:resolve --applied "20251002150000_update_recipe_title_length"
```

### **Example 3: Add Required Field (Careful!)**

⚠️ **This is tricky** - you can't add a required field to a table with existing data!

**Solution A: Make it optional first**
```prisma
model User {
  phoneNumber String?  // Optional first
}
```

**Solution B: Add with default**
```prisma
model User {
  phoneNumber String @default("")  // Default value
}
```

**Solution C: Two-step migration**
```bash
# Step 1: Add as optional
bun run db:migrate -- --name add_phone_optional

# Step 2: (Later) Populate data, then make required
bun run db:migrate -- --name make_phone_required
```

## 🚨 Troubleshooting

### **Migration Failed on Deployment**

If you see this in Render logs:
```
❌ Database migration failed!
🚨 This is a critical error - cannot start application
```

**What to do:**

1. **Check Render logs** for the specific error
2. **Common issues**:
   - Migration SQL syntax error
   - Conflicting constraints
   - Data incompatibility
   - Database connection issue

3. **Fix the migration**:
   ```bash
   # Option 1: Fix and create new migration
   bun run db:migrate -- --name fix_previous_migration
   
   # Option 2: Edit migration file directly (careful!)
   # Edit: prisma/migrations/XXXXX/migration.sql
   
   # Option 3: Rollback (not recommended for production)
   bunx prisma migrate resolve --rolled-back "migration_name"
   ```

### **"Migration already applied" Error**

This means the migration was already run. Safe to ignore or:
```bash
bunx prisma migrate resolve --applied "migration_name"
```

### **Schema and Database Out of Sync**

```bash
# Check status
bunx prisma migrate status

# If needed, create a migration to fix
bun run db:migrate -- --name fix_schema_drift
```

## 📁 Migration File Structure

```
prisma/migrations/
├── 20251002145615_initial_schema/
│   └── migration.sql              # SQL commands
├── 20251002150000_add_user_avatar/
│   └── migration.sql
└── migration_lock.toml            # Lock file (commit this!)
```

### **What Gets Committed to Git:**
- ✅ `prisma/migrations/*/migration.sql` - All migration files
- ✅ `prisma/migrations/migration_lock.toml` - Lock file
- ✅ `prisma/schema.prisma` - Schema definition
- ❌ `node_modules/@prisma/client/` - Generated code (gitignored)

## 🎯 Best Practices

### ✅ **DO**

1. **Test migrations locally first**
   ```bash
   bun run db:migrate -- --name my_change
   # Test your app locally
   # If good, commit and push
   ```

2. **Use descriptive migration names**
   ```bash
   ✅ bun run db:migrate -- --name add_user_avatar
   ✅ bun run db:migrate -- --name fix_recipe_unique_constraint
   ❌ bun run db:migrate -- --name update
   ```

3. **Review migration SQL before committing**
   - Check for data loss
   - Verify constraints
   - Test with production-like data

4. **Deploy to staging first**
   ```bash
   git push origin develop  # Test here first
   # After testing
   git push origin main     # Then production
   ```

5. **Keep migrations small and focused**
   - One logical change per migration
   - Easier to review and rollback

### ❌ **DON'T**

1. **Don't edit migration files after they're applied**
   - Create a new migration instead

2. **Don't delete migration files**
   - They're your database history
   - Needed for new environments

3. **Don't use db:push in production**
   - Always use migrations

4. **Don't skip migration review**
   - Always check the generated SQL

5. **Don't forget to commit migration files**
   ```bash
   # This breaks deployment!
   git add prisma/schema.prisma
   # Missing: git add prisma/migrations/
   ```

## 🔄 Complete Development Workflow

```bash
# 1. Create feature branch
git checkout develop
git pull
git checkout -b feature/add-favorites

# 2. Update Prisma schema
# Edit: prisma/schema.prisma

# 3. Create migration
bun run db:migrate -- --name add_favorites_table

# 4. Test locally
bun run dev
# Test your new feature

# 5. Run tests
bun run test

# 6. Commit everything
git add .
git commit -m "feat: add favorites functionality"

# 7. Push and create PR
git push origin feature/add-favorites

# 8. Merge to develop → Auto-deploys to staging
# 9. Test on staging
# 10. Merge to main → Auto-deploys to production
```

## 📊 Monitoring Migrations

### **Check Migration Status**

```bash
# Local
bunx prisma migrate status

# On Render (via logs)
# Look for:
# "✅ Database migrations applied successfully"
```

### **View Migration History**

```bash
# Check database
bunx prisma studio
# Look at _prisma_migrations table
```

## 🎉 Summary

Your deployment now uses **production-grade database migrations**:

✅ **Versioned**: All changes tracked in git  
✅ **Reviewable**: SQL files can be inspected  
✅ **Safe**: Fails deployment if migration fails  
✅ **Rollbackable**: Can revert changes  
✅ **Automated**: Runs on every deployment  
✅ **Team-friendly**: Everyone uses same migrations  

**Key Command to Remember:**
```bash
# When you change schema locally:
bun run db:migrate -- --name descriptive_name
```

**Deployment handles the rest automatically!** 🚀

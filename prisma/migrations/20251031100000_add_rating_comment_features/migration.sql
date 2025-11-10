-- AlterTable Recipe: Add totalComments counter
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "totalComments" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Recipe: Remove tags field (if exists)
ALTER TABLE "recipes" DROP COLUMN IF EXISTS "tags";

-- AlterTable Recipe: Make dietaryInfo required (NOT NULL)
ALTER TABLE "recipes" ALTER COLUMN "dietaryInfo" SET NOT NULL;

-- AlterTable Rating: Rename value to rating (if column exists)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns 
            WHERE table_name='ratings' AND column_name='value') THEN
    ALTER TABLE "ratings" RENAME COLUMN "value" TO "rating";
  END IF;
END $$;

-- AlterTable Rating: Remove comment field (if exists)
ALTER TABLE "ratings" DROP COLUMN IF EXISTS "comment";

-- CreateIndex: Add indexes for Rating model (if not exists)
CREATE INDEX IF NOT EXISTS "ratings_recipeId_idx" ON "ratings"("recipeId");
CREATE INDEX IF NOT EXISTS "ratings_userId_idx" ON "ratings"("userId");

-- CreateIndex: Add indexes for Comment model (if not exists)
CREATE INDEX IF NOT EXISTS "comments_recipeId_idx" ON "comments"("recipeId");
CREATE INDEX IF NOT EXISTS "comments_userId_idx" ON "comments"("userId");
CREATE INDEX IF NOT EXISTS "comments_createdAt_idx" ON "comments"("createdAt");

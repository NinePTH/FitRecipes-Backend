-- AlterTable: Change imageUrl to imageUrls with data preservation
-- Step 1: Add new imageUrls column as array with default empty array
ALTER TABLE "recipes" ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing imageUrl data to imageUrls array (preserve existing images)
UPDATE "recipes" 
SET "imageUrls" = ARRAY["imageUrl"]::TEXT[] 
WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '';

-- Step 3: Drop old imageUrl column
ALTER TABLE "recipes" DROP COLUMN "imageUrl";

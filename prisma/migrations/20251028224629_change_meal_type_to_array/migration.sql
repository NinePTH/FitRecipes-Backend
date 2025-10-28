/*
  Warnings:

  - Changed the column `mealType` on the `recipes` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/

-- Step 1: Add a temporary column to store the array
ALTER TABLE "recipes" ADD COLUMN "mealType_new" "MealType"[] DEFAULT ARRAY['DINNER']::"MealType"[];

-- Step 2: Copy existing single values into the new array column
UPDATE "recipes" SET "mealType_new" = ARRAY["mealType"]::"MealType"[];

-- Step 3: Drop the old column
ALTER TABLE "recipes" DROP COLUMN "mealType";

-- Step 4: Rename the new column to the original name
ALTER TABLE "recipes" RENAME COLUMN "mealType_new" TO "mealType";

-- Step 5: Set the column to NOT NULL
ALTER TABLE "recipes" ALTER COLUMN "mealType" SET NOT NULL;

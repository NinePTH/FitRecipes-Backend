/*
  Warnings:

  - You are about to drop the column `cookTime` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `dietType` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `prepTime` on the `recipes` table. All the data in the column will be lost.
  - The `cuisineType` column on the `recipes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `cookingTime` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `ingredients` on the `recipes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "comment" TEXT;

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "cookTime",
DROP COLUMN "dietType",
DROP COLUMN "mealType",
DROP COLUMN "prepTime",
ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "cookingTime" INTEGER NOT NULL,
ADD COLUMN     "dietaryInfo" JSONB,
ADD COLUMN     "nutritionInfo" JSONB,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "tags" TEXT[],
DROP COLUMN "ingredients",
ADD COLUMN     "ingredients" JSONB NOT NULL,
DROP COLUMN "cuisineType",
ADD COLUMN     "cuisineType" TEXT;

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipes_mainIngredient_idx" ON "recipes"("mainIngredient");

-- CreateIndex
CREATE INDEX "recipes_authorId_idx" ON "recipes"("authorId");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

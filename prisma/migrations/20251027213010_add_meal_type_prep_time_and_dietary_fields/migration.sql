-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "mealType" "MealType" NOT NULL DEFAULT 'DINNER',
ADD COLUMN     "prepTime" INTEGER NOT NULL DEFAULT 10;

-- CreateIndex
CREATE INDEX "recipes_mealType_idx" ON "recipes"("mealType");

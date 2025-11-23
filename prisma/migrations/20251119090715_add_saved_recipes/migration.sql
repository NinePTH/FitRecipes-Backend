-- CreateTable
CREATE TABLE "saved_recipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_recipes_userId_savedAt_idx" ON "saved_recipes"("userId", "savedAt" DESC);

-- CreateIndex
CREATE INDEX "saved_recipes_recipeId_idx" ON "saved_recipes"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_recipes_userId_recipeId_key" ON "saved_recipes"("userId", "recipeId");

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

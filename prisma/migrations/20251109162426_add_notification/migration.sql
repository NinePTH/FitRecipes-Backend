-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUCCESS', 'ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "recipeId" TEXT,
    "commentId" TEXT,
    "ratingId" TEXT,
    "actorUserId" TEXT,
    "actionType" TEXT NOT NULL,
    "actionUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "webRecipeApproved" BOOLEAN NOT NULL DEFAULT true,
    "webRecipeRejected" BOOLEAN NOT NULL DEFAULT true,
    "webNewComment" BOOLEAN NOT NULL DEFAULT true,
    "webHighRating" BOOLEAN NOT NULL DEFAULT false,
    "webNewSubmission" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushRecipeApproved" BOOLEAN NOT NULL DEFAULT true,
    "pushRecipeRejected" BOOLEAN NOT NULL DEFAULT true,
    "pushNewComment" BOOLEAN NOT NULL DEFAULT false,
    "pushHighRating" BOOLEAN NOT NULL DEFAULT false,
    "pushNewSubmission" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailRecipeApproved" BOOLEAN NOT NULL DEFAULT true,
    "emailRecipeRejected" BOOLEAN NOT NULL DEFAULT true,
    "emailNewComment" BOOLEAN NOT NULL DEFAULT false,
    "emailDigestFrequency" TEXT NOT NULL DEFAULT 'never',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_isDeleted_idx" ON "notifications"("userId", "isRead", "isDeleted");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_fcmToken_key" ON "fcm_tokens"("fcmToken");

-- CreateIndex
CREATE INDEX "fcm_tokens_userId_isActive_idx" ON "fcm_tokens"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

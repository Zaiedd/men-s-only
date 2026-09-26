-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalDaysActive" INTEGER NOT NULL DEFAULT 0,
    "challengesCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDay" DATETIME,
    "categoryAffinity" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "subcategories" TEXT NOT NULL DEFAULT '[]'
);
-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "searchText" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "altText" TEXT,
    "authorName" TEXT,
    "source" TEXT,
    "readingTime" INTEGER,
    "payload" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "featuredAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Content_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "ChallengeProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChallengeProgress_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "ChallengeDayProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "progressId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChallengeDayProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "ChallengeProgress" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentId" TEXT,
    "categoryKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
-- CreateIndex
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");
-- CreateIndex
CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");
-- CreateIndex
CREATE INDEX "Content_status_contentType_idx" ON "Content"("status", "contentType");
-- CreateIndex
CREATE INDEX "Content_status_featured_idx" ON "Content"("status", "featured");
-- CreateIndex
CREATE INDEX "Content_categoryId_status_idx" ON "Content"("categoryId", "status");
-- CreateIndex
CREATE INDEX "Content_publishedAt_idx" ON "Content"("publishedAt");
-- CreateIndex
CREATE INDEX "Content_subcategory_status_idx" ON "Content"("subcategory", "status");
-- CreateIndex
CREATE INDEX "SavedItem_userId_createdAt_idx" ON "SavedItem"("userId", "createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_contentId_key" ON "SavedItem"("userId", "contentId");
-- CreateIndex
CREATE INDEX "ChallengeProgress_userId_status_idx" ON "ChallengeProgress"("userId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "ChallengeProgress_userId_contentId_key" ON "ChallengeProgress"("userId", "contentId");
-- CreateIndex
CREATE INDEX "ChallengeDayProgress_progressId_idx" ON "ChallengeDayProgress"("progressId");
-- CreateIndex
CREATE UNIQUE INDEX "ChallengeDayProgress_progressId_day_key" ON "ChallengeDayProgress"("progressId", "day");
-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");
-- CreateIndex
CREATE INDEX "Activity_userId_type_idx" ON "Activity"("userId", "type");

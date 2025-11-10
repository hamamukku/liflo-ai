/*
  Warnings:

  - You are about to drop the column `aiChallenge` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `aiSkill` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `challengeU` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `goalId` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `reasonU` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `regoalAI` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `skillU` on the `Record` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Record` table. All the data in the column will be lost.
  - Added the required column `text` to the `Record` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "aiComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Record" ("aiComment", "createdAt", "id", "userId") SELECT "aiComment", "createdAt", "id", "userId" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
CREATE INDEX "Record_userId_idx" ON "Record"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

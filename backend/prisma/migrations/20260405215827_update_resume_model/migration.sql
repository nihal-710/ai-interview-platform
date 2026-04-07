/*
  Warnings:

  - You are about to drop the column `createdAt` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `parsedText` on the `resumes` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `resumes` table. All the data in the column will be lost.
  - Added the required column `filePath` to the `resumes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resumes" DROP COLUMN "createdAt",
DROP COLUMN "fileUrl",
DROP COLUMN "parsedText",
DROP COLUMN "score",
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "focusAreas" TEXT[],
ADD COLUMN     "matchedSkills" TEXT[],
ADD COLUMN     "missingSkills" TEXT[],
ADD COLUMN     "recommendations" TEXT[],
ADD COLUMN     "resumeScore" INTEGER,
ADD COLUMN     "targetRole" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

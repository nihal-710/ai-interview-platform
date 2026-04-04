/*
  Warnings:

  - You are about to drop the column `role` on the `interview_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `answer` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `questions` table. All the data in the column will be lost.
  - Added the required column `targetRole` to the `interview_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderIndex` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "interview_sessions" DROP COLUMN "role",
ADD COLUMN     "answeredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "targetRole" TEXT NOT NULL,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "answer",
DROP COLUMN "score",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "difficulty" TEXT DEFAULT 'medium',
ADD COLUMN     "orderIndex" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER,
    "aiFeedback" TEXT,
    "timeTaken" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "responses_questionId_key" ON "responses"("questionId");

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

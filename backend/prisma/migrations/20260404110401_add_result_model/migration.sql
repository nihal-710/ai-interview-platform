-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "completionScore" INTEGER NOT NULL,
    "answerLengthScore" INTEGER NOT NULL,
    "keywordScore" INTEGER NOT NULL,
    "questionScores" JSONB NOT NULL,
    "strengthAreas" TEXT[],
    "improvementAreas" TEXT[],
    "sessionSummary" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "answeredQuestions" INTEGER NOT NULL,
    "totalTimeSecs" INTEGER,
    "scoringVersion" TEXT NOT NULL DEFAULT 'v1-placeholder',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "results_sessionId_key" ON "results"("sessionId");

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

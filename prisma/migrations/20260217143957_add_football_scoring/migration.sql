-- CreateEnum
CREATE TYPE "FootballMatchStatus" AS ENUM ('NOT_STARTED', 'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'EXTRA_TIME_FIRST', 'EXTRA_TIME_SECOND', 'PENALTIES', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FootballEventType" AS ENUM ('GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'CORNER', 'PENALTY_KICK', 'PENALTY_SCORED', 'PENALTY_MISSED', 'OWN_GOAL', 'OFFSIDE', 'FOUL', 'HALF_TIME', 'FULL_TIME', 'KICK_OFF');

-- CreateTable
CREATE TABLE "FootballMatchData" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "halfDuration" INTEGER NOT NULL DEFAULT 45,
    "extraTime" BOOLEAN NOT NULL DEFAULT false,
    "extraTimeDuration" INTEGER,
    "penaltyShootout" BOOLEAN NOT NULL DEFAULT false,
    "halfTimeScoreA" INTEGER NOT NULL DEFAULT 0,
    "halfTimeScoreB" INTEGER NOT NULL DEFAULT 0,
    "fullTimeScoreA" INTEGER NOT NULL DEFAULT 0,
    "fullTimeScoreB" INTEGER NOT NULL DEFAULT 0,
    "extraTimeScoreA" INTEGER,
    "extraTimeScoreB" INTEGER,
    "penaltyScoreA" INTEGER,
    "penaltyScoreB" INTEGER,
    "status" "FootballMatchStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FootballMatchData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FootballPlayerEntry" (
    "id" TEXT NOT NULL,
    "footballMatchDataId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerId" TEXT,
    "team" TEXT NOT NULL,
    "isStarting" BOOLEAN NOT NULL DEFAULT true,
    "minuteSubbedIn" INTEGER,
    "minuteSubbedOut" INTEGER,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTarget" INTEGER NOT NULL DEFAULT 0,
    "fouls" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FootballPlayerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FootballEvent" (
    "id" TEXT NOT NULL,
    "footballMatchDataId" TEXT NOT NULL,
    "eventType" "FootballEventType" NOT NULL,
    "minute" INTEGER NOT NULL,
    "addedTime" INTEGER,
    "playerName" TEXT NOT NULL,
    "playerId" TEXT,
    "assistPlayerName" TEXT,
    "assistPlayerId" TEXT,
    "team" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FootballEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FootballMatchData_matchId_key" ON "FootballMatchData"("matchId");

-- CreateIndex
CREATE INDEX "FootballPlayerEntry_footballMatchDataId_team_idx" ON "FootballPlayerEntry"("footballMatchDataId", "team");

-- CreateIndex
CREATE INDEX "FootballEvent_footballMatchDataId_minute_idx" ON "FootballEvent"("footballMatchDataId", "minute");

-- AddForeignKey
ALTER TABLE "FootballMatchData" ADD CONSTRAINT "FootballMatchData_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballPlayerEntry" ADD CONSTRAINT "FootballPlayerEntry_footballMatchDataId_fkey" FOREIGN KEY ("footballMatchDataId") REFERENCES "FootballMatchData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballPlayerEntry" ADD CONSTRAINT "FootballPlayerEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballEvent" ADD CONSTRAINT "FootballEvent_footballMatchDataId_fkey" FOREIGN KEY ("footballMatchDataId") REFERENCES "FootballMatchData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballEvent" ADD CONSTRAINT "FootballEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FootballEvent" ADD CONSTRAINT "FootballEvent_assistPlayerId_fkey" FOREIGN KEY ("assistPlayerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

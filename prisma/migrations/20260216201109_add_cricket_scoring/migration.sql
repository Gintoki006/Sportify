-- CreateEnum
CREATE TYPE "DismissalType" AS ENUM ('BOWLED', 'CAUGHT', 'LBW', 'RUN_OUT', 'STUMPED', 'HIT_WICKET', 'RETIRED', 'NOT_OUT');

-- CreateEnum
CREATE TYPE "ExtraType" AS ENUM ('WIDE', 'NO_BALL', 'BYE', 'LEG_BYE', 'PENALTY');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "overs" INTEGER,
ADD COLUMN     "playersPerSide" INTEGER;

-- CreateTable
CREATE TABLE "CricketInnings" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inningsNumber" INTEGER NOT NULL,
    "battingTeamName" TEXT NOT NULL,
    "bowlingTeamName" TEXT NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "totalWickets" INTEGER NOT NULL DEFAULT 0,
    "totalOvers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CricketInnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattingEntry" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerId" TEXT,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "ballsFaced" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "strikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isOut" BOOLEAN NOT NULL DEFAULT false,
    "dismissalType" "DismissalType",
    "bowlerName" TEXT,
    "bowlerId" TEXT,
    "fielderName" TEXT,
    "battingOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BowlingEntry" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerId" TEXT,
    "oversBowled" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runsConceded" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "economy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "bowlingOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BowlingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallEvent" (
    "id" TEXT NOT NULL,
    "inningsId" TEXT NOT NULL,
    "overNumber" INTEGER NOT NULL,
    "ballNumber" INTEGER NOT NULL,
    "batsmanName" TEXT NOT NULL,
    "batsmanId" TEXT,
    "bowlerName" TEXT NOT NULL,
    "bowlerId" TEXT,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "extraType" "ExtraType",
    "extraRuns" INTEGER NOT NULL DEFAULT 0,
    "isWicket" BOOLEAN NOT NULL DEFAULT false,
    "dismissalType" "DismissalType",
    "commentary" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CricketInnings_matchId_inningsNumber_key" ON "CricketInnings"("matchId", "inningsNumber");

-- CreateIndex
CREATE INDEX "BallEvent_inningsId_overNumber_ballNumber_idx" ON "BallEvent"("inningsId", "overNumber", "ballNumber");

-- AddForeignKey
ALTER TABLE "CricketInnings" ADD CONSTRAINT "CricketInnings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingEntry" ADD CONSTRAINT "BattingEntry_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "CricketInnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlingEntry" ADD CONSTRAINT "BowlingEntry_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "CricketInnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallEvent" ADD CONSTRAINT "BallEvent_inningsId_fkey" FOREIGN KEY ("inningsId") REFERENCES "CricketInnings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "StatSource" ADD VALUE 'STANDALONE';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "isStandalone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overs" INTEGER,
ADD COLUMN     "playersPerSide" INTEGER,
ADD COLUMN     "sportType" "SportType",
ALTER COLUMN "tournamentId" DROP NOT NULL,
ALTER COLUMN "round" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

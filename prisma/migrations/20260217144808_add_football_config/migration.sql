-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "halfDuration" INTEGER,
ADD COLUMN     "squadSize" INTEGER;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "halfDuration" INTEGER,
ADD COLUMN     "squadSize" INTEGER;

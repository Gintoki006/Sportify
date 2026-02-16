-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('ADMIN', 'HOST', 'PARTICIPANT', 'SPECTATOR');

-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN     "role" "ClubRole" NOT NULL DEFAULT 'SPECTATOR';

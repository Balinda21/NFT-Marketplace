-- CreateEnum
CREATE TYPE "OrderDirection" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyPrice" DECIMAL(18,8),
ADD COLUMN     "buyVolume" DECIMAL(18,8),
ADD COLUMN     "direction" "OrderDirection",
ADD COLUMN     "entryPrice" DECIMAL(18,8),
ADD COLUMN     "isWon" BOOLEAN,
ADD COLUMN     "leverage" DECIMAL(10,2),
ADD COLUMN     "limitOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periodSeconds" INTEGER,
ADD COLUMN     "profitStopLoss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settlementPrice" DECIMAL(18,8),
ADD COLUMN     "symbol" TEXT;

-- CreateIndex
CREATE INDEX "Order_symbol_idx" ON "Order"("symbol");

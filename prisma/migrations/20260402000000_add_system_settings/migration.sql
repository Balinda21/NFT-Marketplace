CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- Seed default: trade mode is 'profit' (admin switch OFF = users get profit)
INSERT INTO "SystemSetting" ("id", "key", "value", "updatedAt")
VALUES (gen_random_uuid(), 'trade_mode', 'profit', NOW());

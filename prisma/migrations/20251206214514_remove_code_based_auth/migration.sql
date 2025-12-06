-- Drop UserLoginCode table first (it depends on LoginMethod enum)
DROP TABLE IF EXISTS "UserLoginCode" CASCADE;

-- Alter LoginMethod enum to remove unused values
-- First, create a new enum with only the values we want
CREATE TYPE "LoginMethod_new" AS ENUM ('GOOGLE', 'PASSWORD');

-- Update any existing columns to use the new enum (if any exist)
-- Since we're dropping UserLoginCode, there should be no columns using this enum
ALTER TYPE "LoginMethod" RENAME TO "LoginMethod_old";
ALTER TYPE "LoginMethod_new" RENAME TO "LoginMethod";

-- Drop the old enum
DROP TYPE "LoginMethod_old";

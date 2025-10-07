-- Add rawData column to surveys table
ALTER TABLE surveys ADD COLUMN "rawData" JSONB;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'surveys' AND column_name = 'rawData';

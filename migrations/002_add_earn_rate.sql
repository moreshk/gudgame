-- Add earn_rate column to user_balances table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_balances' AND column_name='earn_rate') THEN
        ALTER TABLE user_balances
        ADD COLUMN earn_rate INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;
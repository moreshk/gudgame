-- Add token_contract_address column to rock_paper_scissors_bets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='rock_paper_scissors_bets' AND column_name='token_contract_address') THEN
        ALTER TABLE rock_paper_scissors_bets
        ADD COLUMN token_contract_address TEXT;
    END IF;
END $$;

-- Create index on token_contract_address for faster lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rps_bets_token_contract_address ON rock_paper_scissors_bets(token_contract_address);
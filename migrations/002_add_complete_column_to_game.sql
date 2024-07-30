-- Add complete column to game table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='game' AND column_name='complete') THEN
        ALTER TABLE game
        ADD COLUMN complete BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create index on complete column for faster filtering
CREATE INDEX IF NOT EXISTS idx_game_complete ON game(complete);
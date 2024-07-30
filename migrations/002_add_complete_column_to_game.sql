-- Add complete column to game table
ALTER TABLE game
ADD COLUMN complete BOOLEAN DEFAULT FALSE;

-- Create index on complete column for faster filtering
CREATE INDEX IF NOT EXISTS idx_game_complete ON game(complete);
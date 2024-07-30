-- Create game table
CREATE TABLE IF NOT EXISTS game (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    max_possibilities INTEGER NOT NULL,
    initial_threshold INTEGER NOT NULL,
    max_rounds INTEGER NOT NULL,
    creator_address TEXT NOT NULL,
    transaction_signature TEXT NOT NULL
);
-- Create index on timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_game_timestamp ON game(timestamp);

-- Create index on creator_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_creator_address ON game(creator_address);

-- Create index on transaction_signature for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_transaction_signature ON game(transaction_signature);
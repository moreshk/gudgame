-- Create plays table
CREATE TABLE IF NOT EXISTS plays (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_signature TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    amount NUMERIC(20, 9) NOT NULL,
    rng INTEGER NOT NULL,
    threshold INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES game(id)
);

-- Create index on game_id for faster joins
CREATE INDEX IF NOT EXISTS idx_plays_game_id ON plays(game_id);

-- Create index on timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_plays_timestamp ON plays(timestamp);

-- Create index on transaction_signature for faster lookups
CREATE INDEX IF NOT EXISTS idx_plays_transaction_signature ON plays(transaction_signature);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_plays_wallet_address ON plays(wallet_address);
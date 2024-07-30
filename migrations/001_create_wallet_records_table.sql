-- Create wallet_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_records (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_signature TEXT
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_records_wallet_address ON wallet_records(wallet_address);

-- Create index on created_at for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_wallet_records_created_at ON wallet_records(created_at);
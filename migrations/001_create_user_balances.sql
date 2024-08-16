-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_balances_wallet_address ON user_balances(wallet_address);
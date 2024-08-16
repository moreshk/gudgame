-- Add earn_rate column to user_balances table
ALTER TABLE user_balances
ADD COLUMN earn_rate INTEGER NOT NULL DEFAULT 1;
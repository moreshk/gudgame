-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    referral_code TEXT UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_referral_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (wallet_address) REFERENCES user_balances(wallet_address)
);

-- Create index on wallet_address and referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_wallet ON referral_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);

-- Create referral_relationships table
CREATE TABLE IF NOT EXISTS referral_relationships (
    id SERIAL PRIMARY KEY,
    referrer_wallet TEXT NOT NULL,
    referred_wallet TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_wallet) REFERENCES user_balances(wallet_address),
    FOREIGN KEY (referred_wallet) REFERENCES user_balances(wallet_address)
);

-- Create index on referrer_wallet and referred_wallet for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referrer ON referral_relationships(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_relationships_referred ON referral_relationships(referred_wallet);

-- Create referral_transactions table
CREATE TABLE IF NOT EXISTS referral_transactions (
    id SERIAL PRIMARY KEY,
    referral_relationship_id INTEGER NOT NULL,
    referrer_points_awarded INTEGER NOT NULL,
    referred_points_awarded INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_relationship_id) REFERENCES referral_relationships(id)
);

-- Create referral_settings table
CREATE TABLE IF NOT EXISTS referral_settings (
    id SERIAL PRIMARY KEY,
    referrer_reward INTEGER NOT NULL DEFAULT 100,
    referee_reward INTEGER NOT NULL DEFAULT 50,
    max_referrals_per_user INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default values into referral_settings
INSERT INTO referral_settings (referrer_reward, referee_reward, max_referrals_per_user)
VALUES (100, 50, 10)
ON CONFLICT DO NOTHING;
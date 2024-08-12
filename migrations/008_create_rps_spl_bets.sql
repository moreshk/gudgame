-- Create rock_paper_scissors_spl_bets table
CREATE TABLE IF NOT EXISTS rock_paper_scissors_spl_bets (
    id SERIAL PRIMARY KEY,
    bet_maker_address TEXT NOT NULL,
    maker_signature TEXT NOT NULL,
    maker_bet TEXT NOT NULL,
    pot_address TEXT NOT NULL,
    bet_amount NUMERIC NOT NULL,
    original_bet_amount NUMERIC NOT NULL,
    token_contract_address TEXT NOT NULL,
    token_decimals INTEGER NOT NULL,
    bet_making_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bet_taker_address TEXT,
    taker_signature TEXT,
    taker_bet TEXT,
    bet_taking_timestamp TIMESTAMP WITH TIME ZONE,
    winner_address TEXT,
    winnings_disbursement_signature TEXT
);

-- Create index on bet_maker_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_bet_maker_address ON rock_paper_scissors_spl_bets(bet_maker_address);

-- Create index on bet_taker_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_bet_taker_address ON rock_paper_scissors_spl_bets(bet_taker_address);

-- Create index on bet_making_timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_bet_making_timestamp ON rock_paper_scissors_spl_bets(bet_making_timestamp);

-- Create index on bet_taking_timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_bet_taking_timestamp ON rock_paper_scissors_spl_bets(bet_taking_timestamp);

-- Create index on pot_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_pot_address ON rock_paper_scissors_spl_bets(pot_address);

-- Create index on token_contract_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_spl_bets_token_contract_address ON rock_paper_scissors_spl_bets(token_contract_address);
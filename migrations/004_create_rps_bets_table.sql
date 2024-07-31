-- Create rock_paper_scissors_bets table
CREATE TABLE IF NOT EXISTS rock_paper_scissors_bets (
    id SERIAL PRIMARY KEY,
    bet_maker_address TEXT NOT NULL,
    maker_signature TEXT NOT NULL,
    maker_bet TEXT NOT NULL CHECK (maker_bet IN ('Rock', 'Paper', 'Scissors')),
    pot_address TEXT NOT NULL,
    bet_amount NUMERIC(20, 9) NOT NULL,
    bet_making_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    bet_taker_address TEXT,
    taker_signature TEXT,
    taker_bet TEXT CHECK (taker_bet IN ('Rock', 'Paper', 'Scissors')),
    bet_taking_timestamp TIMESTAMP WITH TIME ZONE,
    winner_address TEXT,
    winnings_disbursement_signature TEXT
);

-- Create index on bet_maker_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_bets_bet_maker_address ON rock_paper_scissors_bets(bet_maker_address);

-- Create index on bet_taker_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_bets_bet_taker_address ON rock_paper_scissors_bets(bet_taker_address);

-- Create index on bet_making_timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_rps_bets_bet_making_timestamp ON rock_paper_scissors_bets(bet_making_timestamp);

-- Create index on bet_taking_timestamp for faster sorting and filtering
CREATE INDEX IF NOT EXISTS idx_rps_bets_bet_taking_timestamp ON rock_paper_scissors_bets(bet_taking_timestamp);

-- Create index on pot_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rps_bets_pot_address ON rock_paper_scissors_bets(pot_address);
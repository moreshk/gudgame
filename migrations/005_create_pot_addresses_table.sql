-- Create extension for encryption functions if not already available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create pot_addresses table
CREATE TABLE IF NOT EXISTS pot_addresses (
    id SERIAL PRIMARY KEY,
    pot_address TEXT NOT NULL UNIQUE,
    encrypted_private_key BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on pot_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_pot_addresses_pot_address ON pot_addresses(pot_address);

-- Function to encrypt the private key
CREATE OR REPLACE FUNCTION encrypt_private_key(private_key TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(private_key, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt the private key
CREATE OR REPLACE FUNCTION decrypt_private_key(encrypted_private_key BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_private_key::bytea, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of how to insert a new pot address with encrypted private key
-- DO $$
-- BEGIN
--     INSERT INTO pot_addresses (pot_address, encrypted_private_key)
--     VALUES (
--         'example_pot_address',
--         encrypt_private_key('example_private_key', current_setting('app.encryption_key'))
--     );
-- END $$;

-- Example of how to retrieve and decrypt a private key
-- SELECT pot_address, decrypt_private_key(encrypted_private_key, current_setting('app.encryption_key')) AS decrypted_private_key
-- FROM pot_addresses
-- WHERE pot_address = 'example_pot_address';
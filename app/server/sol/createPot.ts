'use server';

import { Keypair } from '@solana/web3.js';
import { sql } from '@vercel/postgres';
import bs58 from 'bs58';
import { createCipheriv, randomBytes, createHash } from 'crypto';

export async function createSolanaPotAddress() {
  try {
    // Generate a new Solana keypair
    const keypair = Keypair.generate();

    // Get the public key (address) as a base58 encoded string
    const potAddress = keypair.publicKey.toBase58();

    // Get the private key as a base58 encoded string
    const privateKey = bs58.encode(keypair.secretKey);

    // Encrypt the private key
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Generate a 32-byte key from the environment variable
    const hash = createHash('sha256');
    hash.update(encryptionKey);
    const key = hash.digest();

    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
    encryptedPrivateKey += cipher.final('hex');
    const encryptedData = iv.toString('hex') + ':' + encryptedPrivateKey;

    // Store the address and encrypted private key in the database
    const result = await sql`
      INSERT INTO pot_addresses (pot_address, encrypted_private_key)
      VALUES (${potAddress}, ${encryptedData})
      RETURNING id;
    `;

    return {
      success: true,
      id: result.rows[0].id,
      potAddress: potAddress
    };
  } catch (error) {
    console.error('Error creating Solana pot address:', error);
    return { success: false, error: 'Failed to create Solana pot address' };
  }
}
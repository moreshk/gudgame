'use server';

import { sql } from '@vercel/postgres';
import { createCipheriv, randomBytes, createHash } from 'crypto';

interface CreateRPSBetInput {
  betMakerAddress: string;
  makerSignature: string;
  makerBet: 'Rock' | 'Paper' | 'Scissors';
  betAmount: number;
  potAddress: string;
}

export async function createRPSBet(input: CreateRPSBetInput) {
  try {
    const { betMakerAddress, makerSignature, makerBet, betAmount, potAddress } = input;

    // Encrypt the makerBet
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
    let encryptedMakerBet = cipher.update(makerBet, 'utf8', 'hex');
    encryptedMakerBet += cipher.final('hex');
    const encryptedData = iv.toString('hex') + ':' + encryptedMakerBet;

    const result = await sql`
      INSERT INTO rock_paper_scissors_bets (
        bet_maker_address,
        maker_signature,
        maker_bet,
        bet_amount,
        pot_address
      )
      VALUES (
        ${betMakerAddress},
        ${makerSignature},
        ${encryptedData},
        ${betAmount},
        ${potAddress}
      )
      RETURNING id, bet_making_timestamp;
    `;

    const newBet = result.rows[0];

    return {
      success: true,
      id: newBet.id,
      betMakingTimestamp: newBet.bet_making_timestamp
    };
  } catch (error) {
    console.error('Error creating RPS bet:', error);
    return { success: false, error: 'Failed to create RPS game' };
  }
}
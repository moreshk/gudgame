'use server';

import { sql } from '@vercel/postgres';
import { createCipheriv, randomBytes, createHash } from 'crypto';

interface CreateRPSSplBetInput {
  betMakerAddress: string;
  makerSignature: string;
  makerBet: 'Rock' | 'Paper' | 'Scissors';
  betAmount: number;
  potAddress: string;
  tokenMint: string;
  tokenDecimals: number;
}

export async function createRPSSplBet(input: CreateRPSSplBetInput) {
  try {
    const { betMakerAddress, makerSignature, makerBet, betAmount, potAddress, tokenMint, tokenDecimals } = input;

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

    // Convert betAmount to the smallest unit based on tokenDecimals
    const betAmountInSmallestUnit = betAmount * Math.pow(10, tokenDecimals);

    const result = await sql`
      INSERT INTO rock_paper_scissors_spl_bets (
        bet_maker_address,
        maker_signature,
        maker_bet,
        bet_amount,
        original_bet_amount,
        pot_address,
        token_contract_address,
        token_decimals
      )
      VALUES (
        ${betMakerAddress},
        ${makerSignature},
        ${encryptedData},
        ${betAmountInSmallestUnit.toString()},
        ${betAmount.toString()},
        ${potAddress},
        ${tokenMint},
        ${tokenDecimals}
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
    console.error('Error creating RPS SPL bet:', error);
    return { success: false, error: 'Failed to create RPS SPL game' };
  }
}
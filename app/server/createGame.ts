'use server';

import { sql } from '@vercel/postgres';

export async function createGame(
  maxPossibilities: number,
  initialThreshold: number,
  maxRounds: number,
  creatorAddress: string,
  transactionSignature: string
) {
  try {
    const result = await sql`
      INSERT INTO game (
        max_possibilities,
        initial_threshold,
        max_rounds,
        creator_address,
        transaction_signature
      )
      VALUES (
        ${maxPossibilities},
        ${initialThreshold},
        ${maxRounds},
        ${creatorAddress},
        ${transactionSignature}
      )
      RETURNING id, timestamp;
    `;
    
    return {
      success: true,
      id: result.rows[0].id,
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    console.error('Error creating game:', error);
    return { success: false, error: 'Failed to create game' };
  }
}
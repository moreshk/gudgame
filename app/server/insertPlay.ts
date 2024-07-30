'use server';

import { sql } from '@vercel/postgres';

export async function createPlay(
  gameId: number,
  transactionSignature: string,
  walletAddress: string,
  amount: number,
  rng: number,
  threshold: number
) {
  try {
    const result = await sql`
      INSERT INTO plays (
        game_id,
        transaction_signature,
        wallet_address,
        amount,
        rng,
        threshold
      )
      VALUES (
        ${gameId},
        ${transactionSignature},
        ${walletAddress},
        ${amount},
        ${rng},
        ${threshold}
      )
      RETURNING id, timestamp;
    `;
    
    return {
      success: true,
      id: result.rows[0].id,
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    console.error('Error creating play:', error);
    return { success: false, error: 'Failed to create play' };
  }
}
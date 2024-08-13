'use server';

import { sql } from '@vercel/postgres';

interface UpdateRPSBetInput {
  id: number;
  betTakerAddress: string;
  takerSignature: string;
  takerBet: 'Rock' | 'Paper' | 'Scissors';
}

export async function updateRPSBet(input: UpdateRPSBetInput) {
  try {
    const { id, betTakerAddress, takerSignature, takerBet } = input;

    const result = await sql`
      UPDATE rock_paper_scissors_bets
      SET 
        bet_taker_address = ${betTakerAddress},
        taker_signature = ${takerSignature},
        taker_bet = ${takerBet},
        bet_taking_timestamp = CURRENT_TIMESTAMP
      WHERE id = ${id}
      AND bet_taker_address IS NULL
      RETURNING id, bet_taking_timestamp;
    `;

    if (result.rowCount === 0) {
      return { success: false, error: 'Bet not found or already taken' };
    }

    const updatedBet = result.rows[0];

    return {
      success: true,
      id: updatedBet.id,
      betTakingTimestamp: updatedBet.bet_taking_timestamp
    };
  } catch (error) {
    console.error('Error updating RPS bet:', error);
    return { success: false, error: 'Failed to update RPS bet' };
  }
}
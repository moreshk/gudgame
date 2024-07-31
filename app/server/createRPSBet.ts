'use server';

import { sql } from '@vercel/postgres';

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
        ${makerBet},
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
    return { success: false, error: 'Failed to create RPS bet' };
  }
}
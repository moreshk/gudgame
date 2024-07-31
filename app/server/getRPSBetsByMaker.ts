'use server';

import { sql } from '@vercel/postgres';

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_signature: string;
  maker_bet: 'Rock' | 'Paper' | 'Scissors';
  pot_address: string;
  bet_amount: number;
  bet_making_timestamp: Date;
  bet_taker_address: string | null;
  taker_signature: string | null;
  taker_bet: 'Rock' | 'Paper' | 'Scissors' | null;
  bet_taking_timestamp: Date | null;
  winner_address: string | null;
  winnings_disbursement_signature: string | null;
}

export async function getRPSBetsByMaker(walletAddress: string) {
  try {
    const result = await sql<RPSBet>`
      SELECT *
      FROM rock_paper_scissors_bets
      WHERE bet_maker_address = ${walletAddress}
      ORDER BY bet_making_timestamp DESC;
    `;

    return {
      success: true,
      bets: result.rows
    };
  } catch (error) {
    console.error('Error fetching RPS bets by maker:', error);
    return { success: false, error: 'Failed to fetch RPS bets' };
  }
}
'use server';

import { sql } from '@vercel/postgres';

interface RPSSplBet {
  id: number;
  bet_maker_address: string;
  maker_signature: string;
  maker_bet: string;
  pot_address: string;
  bet_amount: number;
  original_bet_amount: number;
  token_contract_address: string;
  token_decimals: number;
  bet_making_timestamp: Date;
  bet_taker_address: string | null;
  taker_signature: string | null;
  taker_bet: string | null;
  bet_taking_timestamp: Date | null;
  winner_address: string | null;
  winnings_disbursement_signature: string | null;
}

export async function getRPSSplBetsByMaker(walletAddress: string) {
  try {
    const result = await sql<RPSSplBet>`
      SELECT *
      FROM rock_paper_scissors_spl_bets
      WHERE bet_maker_address = ${walletAddress}
      ORDER BY bet_making_timestamp DESC;
    `;

    return {
      success: true,
      bets: result.rows
    };
  } catch (error) {
    console.error('Error fetching RPS SPL bets by maker:', error);
    return { success: false, error: 'Failed to fetch RPS SPL bets' };
  }
}
'use server';

import { sql } from '@vercel/postgres';
import { getTokenInfo } from './getTokenInfo';

interface RPSSplBet {
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
  token_contract_address: string;
}

export async function getRPSSplBetById(id: number) {
  try {
    const result = await sql<RPSSplBet>`
      SELECT *
      FROM rock_paper_scissors_spl_bets
      WHERE id = ${id};
    `;

    if (result.rows.length === 0) {
      return { success: false, error: 'Bet not found' };
    }

    const bet = result.rows[0];
    const tokenInfo = await getTokenInfo(bet.token_contract_address);

    if (!tokenInfo.success) {
      return { success: false, error: 'Failed to fetch token info' };
    }

    return {
      success: true,
      bet: {
        ...bet,
        token_symbol: tokenInfo.tokenInfo?.token_symbol ?? 'Unknown',
        token_decimals: tokenInfo.tokenInfo?.token_decimals ?? 0
      }
    };
  } catch (error) {
    console.error('Error fetching RPS SPL bet by ID:', error);
    return { success: false, error: 'Failed to fetch RPS SPL bet' };
  }
}
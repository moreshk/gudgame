'use server';

import { sql } from '@vercel/postgres';

interface OpenRPSBet {
  id: number;
  bet_maker_address: string;
  bet_amount: number;
  pot_address: string;
  bet_making_timestamp: Date;
}

export async function getOpenRPSBets() {
  try {
    const result = await sql<OpenRPSBet>`
      SELECT id, bet_maker_address, bet_amount, pot_address, bet_making_timestamp
      FROM rock_paper_scissors_spl_bets
      WHERE bet_maker_address IS NOT NULL
        AND bet_taker_address IS NULL
      ORDER BY bet_making_timestamp DESC;
    `;

    return {
      success: true,
      bets: result.rows
    };
  } catch (error) {
    console.error('Error fetching open RPS bets:', error);
    return { success: false, error: 'Failed to fetch open RPS bets' };
  }
}
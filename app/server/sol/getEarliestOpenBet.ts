'use server';

import { sql } from '@vercel/postgres';

interface EarliestOpenBet {
  id: number;
}

export async function getEarliestOpenRPSBet() {
  try {
    const result = await sql<EarliestOpenBet>`
      SELECT id
      FROM rock_paper_scissors_bets
      WHERE bet_taker_address IS NULL
      ORDER BY bet_making_timestamp ASC
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return { success: false, error: 'No open bets found' };
    }

    return {
      success: true,
      betId: result.rows[0].id
    };
  } catch (error) {
    console.error('Error fetching earliest open RPS bet:', error);
    return { success: false, error: 'Failed to fetch earliest open RPS bet' };
  }
}
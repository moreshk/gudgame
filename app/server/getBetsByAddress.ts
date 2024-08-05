'use server';

import { sql } from '@vercel/postgres';
import { decryptBet } from './decryptBet';

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_bet: string;
  bet_taker_address: string | null;
  taker_bet: string | null;
  bet_amount: number;
  winner_address: string;
  is_maker: boolean;
}

export async function getLastResolvedBets(walletAddress: string) {
  try {
    const result = await sql<RPSBet>`
      SELECT 
        id,
        bet_maker_address,
        maker_bet,
        bet_taker_address,
        taker_bet,
        bet_amount,
        winner_address,
        CASE 
          WHEN bet_maker_address = ${walletAddress} THEN true
          ELSE false
        END as is_maker
      FROM rock_paper_scissors_bets
      WHERE 
        (bet_maker_address = ${walletAddress} OR bet_taker_address = ${walletAddress})
        AND winner_address IS NOT NULL
      ORDER BY 
        CASE 
          WHEN bet_maker_address = ${walletAddress} THEN bet_making_timestamp
          ELSE bet_taking_timestamp
        END DESC
      LIMIT 8;
    `;

    const bets = await Promise.all(result.rows.map(async (bet) => {
      if (bet.is_maker) {
        try {
          bet.maker_bet = await decryptBet(bet.maker_bet);
        } catch (error) {
          console.error(`Failed to decrypt bet for id ${bet.id}:`, error);
          bet.maker_bet = 'Decryption failed';
        }
      }
      return bet;
    }));

    return {
      success: true,
      bets: bets
    };
  } catch (error) {
    console.error('Error fetching last resolved RPS bets:', error);
    return { success: false, error: 'Failed to fetch last resolved RPS bets' };
  }
}
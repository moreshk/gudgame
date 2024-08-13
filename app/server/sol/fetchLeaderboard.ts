'use server';

import { sql } from '@vercel/postgres';

interface LeaderboardEntry {
  wallet_address: string;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  earnings: number;
}

export async function fetchLeaderboard(): Promise<{ success: boolean; leaderboard?: LeaderboardEntry[]; error?: string }> {
  try {
    const result = await sql`
      WITH game_results AS (
        SELECT
          CASE
            WHEN bet_maker_address = winner_address THEN bet_maker_address
            WHEN bet_taker_address = winner_address THEN bet_taker_address
            ELSE COALESCE(bet_maker_address, bet_taker_address)
          END AS player,
          CASE
            WHEN winner_address IS NULL THEN 'draw'
            WHEN bet_maker_address = winner_address THEN 'win'
            WHEN bet_taker_address = winner_address THEN 'win'
            ELSE 'loss'
          END AS result,
          CASE
            WHEN winner_address IS NOT NULL THEN bet_amount
            ELSE 0
          END AS earnings
        FROM rock_paper_scissors_bets
        WHERE bet_taker_address IS NOT NULL
      )
      SELECT
        player AS wallet_address,
        COUNT(*) AS games_played,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
        SUM(earnings) AS earnings
      FROM game_results
      GROUP BY player
      ORDER BY earnings DESC, wins DESC, games_played DESC
    `;

    const leaderboard: LeaderboardEntry[] = result.rows.map(row => ({
      wallet_address: row.wallet_address,
      games_played: Number(row.games_played),
      wins: Number(row.wins),
      losses: Number(row.losses),
      draws: Number(row.draws),
      earnings: Number(row.earnings)
    }));

    return { success: true, leaderboard };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, error: 'Failed to fetch leaderboard' };
  }
}
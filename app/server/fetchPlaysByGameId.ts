'use server';

import { sql } from '@vercel/postgres';

export async function fetchPlaysByGameId(gameId: number) {
  try {
    const result = await sql`
      SELECT * FROM plays 
      WHERE game_id = ${gameId} 
      ORDER BY timestamp DESC
    `;
    
    return { success: true, plays: result.rows };
  } catch (error) {
    console.error('Error fetching plays:', error);
    return { success: false, error: 'Failed to fetch plays' };
  }
}
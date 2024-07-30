'use server';

import { sql } from '@vercel/postgres';

export async function fetchGames() {
  try {
    const result = await sql`
      SELECT * FROM game
      WHERE complete = false
      ORDER BY timestamp DESC;
    `;
    
    return {
      success: true,
      games: result.rows
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    return { success: false, error: 'Failed to fetch games' };
  }
}
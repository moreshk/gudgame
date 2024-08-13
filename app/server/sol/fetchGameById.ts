'use server';

import { sql } from '@vercel/postgres';

export async function fetchGameById(id: number) {
  try {
    const result = await sql`
      SELECT * FROM game WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return { success: false, error: 'Game not found' };
    }

    return { success: true, game: result.rows[0] };
  } catch (error) {
    console.error('Error fetching game:', error);
    return { success: false, error: 'Failed to fetch game' };
  }
}
'use server';

import { sql } from '@vercel/postgres';

export async function fetchGames() {
  try {
    const query = `
    SELECT * FROM game
    WHERE complete = false
    ORDER BY timestamp DESC;
  `;
  console.log('Executing SQL query:', query);
  const result = await sql.query(query);
 
    
    
    console.log(`Raw SQL result:`, JSON.stringify(result, null, 2));
    console.log(`Fetched ${result.rows.length} games from the database`);
    
    // Add this line to log all rows
    console.log(`All rows:`, JSON.stringify(result.rows, null, 2));
    
    // Add this to check if any rows have complete = true
    const completeGames = result.rows.filter(game => game.complete === true);
    console.log(`Games with complete = true:`, JSON.stringify(completeGames, null, 2));
    
    return {
      success: true,
      games: result.rows
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    return { success: false, error: 'Failed to fetch games' };
  }
}
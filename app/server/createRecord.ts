'use server';

import { sql } from '@vercel/postgres';

export async function createRecord(walletAddress: string) {
  try {
    const result = await sql`
      INSERT INTO wallet_records (wallet_address, created_at)
      VALUES (${walletAddress}, NOW())
      RETURNING id;
    `;
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('Error creating record:', error);
    return { success: false, error: 'Failed to create record' };
  }
}
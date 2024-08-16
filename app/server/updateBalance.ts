'use server'

import { sql } from '@vercel/postgres';

export async function updateBalance(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const result = await sql`
      INSERT INTO user_balances (wallet_address, balance, earn_rate)
      VALUES (${walletAddress}, 1, 1)
      ON CONFLICT (wallet_address)
      DO UPDATE SET balance = user_balances.balance + user_balances.earn_rate
      RETURNING balance
    `;

    return result.rows[0].balance;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw new Error('Failed to update balance');
  }
}
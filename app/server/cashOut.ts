'use server'

import { sql } from '@vercel/postgres';

export async function cashOut(walletAddress: string, currentPrice: number) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  // Ensure currentPrice is a number and round it to the nearest integer
  const price = Math.round(Number(currentPrice));
  if (isNaN(price)) {
    throw new Error('Invalid price');
  }

  try {
    const result = await sql`
      UPDATE user_balances
      SET balance = ${price}
      WHERE wallet_address = ${walletAddress}
      RETURNING balance
    `;

    if (result.rowCount === 0) {
      // If no rows were updated, insert a new record
      const insertResult = await sql`
        INSERT INTO user_balances (wallet_address, balance)
        VALUES (${walletAddress}, ${price})
        RETURNING balance
      `;
      return insertResult.rows[0].balance;
    }

    return result.rows[0].balance;
  } catch (error) {
    console.error('Error cashing out:', error);
    throw new Error('Failed to cash out');
  }
}
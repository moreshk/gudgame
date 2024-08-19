'use server'

import { sql } from '@vercel/postgres';

export async function upgradeEarnRate(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    // First, get the current balance and earn rate
    const currentData = await sql`
      SELECT balance, earn_rate FROM user_balances WHERE wallet_address = ${walletAddress}
    `;

    if (currentData.rowCount === 0) {
      throw new Error('User not found');
    }

    const currentBalance = currentData.rows[0].balance;
    const currentEarnRate = currentData.rows[0].earn_rate;

    // Calculate the cost for the next upgrade
    const upgradeCost = 300 * Math.pow(2, currentEarnRate - 1);

    // Check if the user has enough balance
    if (currentBalance < upgradeCost) {
      throw new Error('Insufficient balance for upgrade');
    }

    // Perform the upgrade
    const result = await sql`
      UPDATE user_balances
      SET balance = balance - ${upgradeCost}, earn_rate = earn_rate + 1
      WHERE wallet_address = ${walletAddress}
      RETURNING balance, earn_rate
    `;

    return result.rows[0];
  } catch (error) {
    console.error('Error upgrading earn rate:', error);
    throw error;
  }
}
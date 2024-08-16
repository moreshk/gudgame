import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { walletAddress } = await request.json();

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const result = await sql`
      INSERT INTO user_balances (wallet_address, balance)
      VALUES (${walletAddress}, 1)
      ON CONFLICT (wallet_address)
      DO UPDATE SET balance = user_balances.balance + 1
      RETURNING balance
    `;

    return NextResponse.json({ balance: result.rows[0].balance });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  try {
    const result = await sql`
      SELECT balance, earn_rate FROM user_balances WHERE wallet_address = ${wallet}
    `;

    if (result.rows.length === 0) {
      await sql`
        INSERT INTO user_balances (wallet_address, balance, earn_rate) VALUES (${wallet}, 0, 1)
      `;
      return NextResponse.json({ balance: 0, earnRate: 1 });
    }

    return NextResponse.json({ 
      balance: result.rows[0].balance, 
      earnRate: result.rows[0].earn_rate 
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
'use server'

import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// Generate a referral code
export async function generateReferralCode(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const referralCode = crypto.randomBytes(4).toString('hex');
    
    await sql`
      INSERT INTO referral_codes (wallet_address, referral_code)
      VALUES (${walletAddress}, ${referralCode})
      ON CONFLICT (wallet_address) 
      DO UPDATE SET referral_code = ${referralCode}
    `;

    return referralCode;
  } catch (error) {
    console.error('Error generating referral code:', error);
    throw error;
  }
}

// Validate a referral code
export async function validateReferralCode(referralCode: string) {
  if (!referralCode) {
    throw new Error('Referral code is required');
  }

  try {
    const result = await sql`
      SELECT wallet_address FROM referral_codes
      WHERE referral_code = ${referralCode}
    `;

    return Array.isArray(result.rows) && result.rows.length > 0
      ? result.rows[0].wallet_address
      : null;
  } catch (error) {
    console.error('Error validating referral code:', error);
    throw error;
  }
}

// Create a referral relationship
export async function createReferralRelationship(referrerWallet: string, referredWallet: string) {
  if (!referrerWallet || !referredWallet) {
    throw new Error('Both referrer and referred wallet addresses are required');
  }

  try {
    await sql`
      INSERT INTO referral_relationships (referrer_wallet, referred_wallet)
      VALUES (${referrerWallet}, ${referredWallet})
    `;

    await sql`
      UPDATE referral_codes
      SET total_referrals = total_referrals + 1, last_referral_at = CURRENT_TIMESTAMP
      WHERE wallet_address = ${referrerWallet}
    `;
  } catch (error) {
    console.error('Error creating referral relationship:', error);
    throw error;
  }
}

// Award referral points
export async function awardReferralPoints(referrerWallet: string, referredWallet: string) {
  if (!referrerWallet || !referredWallet) {
    throw new Error('Both referrer and referred wallet addresses are required');
  }

  try {
    const settings = await sql`SELECT * FROM referral_settings LIMIT 1`;
    const referrerReward = settings.rows[0].referrer_reward;
    const refereeReward = settings.rows[0].referee_reward;

    const relationship = await sql`
      INSERT INTO referral_relationships (referrer_wallet, referred_wallet)
      VALUES (${referrerWallet}, ${referredWallet})
      RETURNING id
    `;

    await sql`
      INSERT INTO referral_transactions (referral_relationship_id, referrer_points_awarded, referred_points_awarded)
      VALUES (${relationship.rows[0].id}, ${referrerReward}, ${refereeReward})
    `;

    await sql`
      UPDATE user_balances
      SET balance = balance + ${referrerReward}
      WHERE wallet_address = ${referrerWallet}
    `;

    await sql`
      UPDATE user_balances
      SET balance = balance + ${refereeReward}
      WHERE wallet_address = ${referredWallet}
    `;

    return { referrerReward, refereeReward };
  } catch (error) {
    console.error('Error awarding referral points:', error);
    throw error;
  }
}

// Get user referral statistics
export async function getUserReferralStats(walletAddress: string) {
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const referralCode = await sql`
      SELECT referral_code, total_referrals FROM referral_codes
      WHERE wallet_address = ${walletAddress}
    `;

    const referralEarnings = await sql`
      SELECT SUM(referrer_points_awarded) as total_earnings
      FROM referral_transactions
      JOIN referral_relationships ON referral_transactions.referral_relationship_id = referral_relationships.id
      WHERE referral_relationships.referrer_wallet = ${walletAddress}
    `;

    return {
      referralCode: referralCode.rows[0]?.referral_code || null,
      totalReferrals: referralCode.rows[0]?.total_referrals || 0,
      totalEarnings: referralEarnings.rows[0]?.total_earnings || 0
    };
  } catch (error) {
    console.error('Error getting user referral stats:', error);
    throw error;
  }
}
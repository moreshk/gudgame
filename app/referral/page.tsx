'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserReferralStats } from '../server/referral';
import Navbar from '../components/Navbar';
import { ClipboardCopy } from 'lucide-react';

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState<number | null>(null);
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { publicKey } = useWallet();

  useEffect(() => {
    const fetchReferralData = async () => {
      if (publicKey) {
        try {
          const stats = await getUserReferralStats(publicKey.toString());
          setReferralCode(stats.referralCode);
          setTotalReferrals(stats.totalReferrals);
          setTotalEarnings(stats.totalEarnings);
        } catch (error) {
          console.error('Error fetching referral data:', error);
        }
      }
    };

    fetchReferralData();
  }, [publicKey]);

  const handleCopyClick = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Your Referral Code</h1>
        <div className="bg-gray-800 shadow-md rounded-lg p-6 text-white">
          {publicKey ? (
            <>
              {referralCode ? (
                <div className="flex items-center mb-4">
                  <span className="mr-2">{referralCode}</span>
                  <button
                    onClick={handleCopyClick}
                    className="p-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                  >
                    <ClipboardCopy size={16} />
                  </button>
                  {isCopied && (
                    <span className="ml-2 text-green-400">Copied!</span>
                  )}
                </div>
              ) : (
                <p>Loading referral code...</p>
              )}
              <p className="mb-2">Total Referrals: {totalReferrals !== null ? totalReferrals : 'Loading...'}</p>
              <p>Total Earnings: {totalEarnings !== null ? totalEarnings : 'Loading...'}</p>
            </>
          ) : (
            <p>Please connect your wallet to view your referral code</p>
          )}
        </div>
      </main>
    </div>
  );
}
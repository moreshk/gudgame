'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      } else {
        setBalance(null);
      }
    }

    fetchBalance();
    // Set up an interval to fetch the balance every 30 seconds
    const intervalId = setInterval(fetchBalance, 30000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center">
        {publicKey ? (
          <>
            <h1 className="text-3xl font-bold mb-4">
              Welcome {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </h1>
            {balance !== null ? (
              <p className="text-xl">
                Your balance: {balance.toFixed(4)} SOL
              </p>
            ) : (
              <p className="text-xl">Loading balance...</p>
            )}
          </>
        ) : (
          <h1 className="text-3xl font-bold">Please connect your wallet</h1>
        )}
      </main>
    </div>
  );
}
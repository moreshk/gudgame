'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAddress } from './utils/formatters';
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const CH2_TOKEN_ADDRESS = 'Eyi4ZC14YyADn3P9tQ7oT5cmq6DCxBTt9ZLszdfX3mh2';

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ch2Status, setCh2Status] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [earnRate, setEarnRate] = useState<number>(1);
  const [earnAnimations, setEarnAnimations] = useState<number[]>([]);

  const { publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress(null);
      setCh2Status(null);
      setBalance(0);
    }
  }, [publicKey]);

  const fetchBalance = useCallback(async () => {
    if (walletAddress) {
      const response = await fetch(`/api/balance?wallet=${walletAddress}`);
      const data = await response.json();
      setBalance(data.balance);
      setEarnRate(data.earnRate);
    }
  }, [walletAddress]);

  useEffect(() => {
    async function checkCh2TokenHolding() {
      if (walletAddress) {
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(walletAddress),
            { programId: TOKEN_PROGRAM_ID }
          );

          const ch2TokenAccount = tokenAccounts.value.find(
            account => account.account.data.parsed.info.mint === CH2_TOKEN_ADDRESS
          );

          if (ch2TokenAccount) {
            const tokenAmount = await connection.getTokenAccountBalance(ch2TokenAccount.pubkey);
            if (BigInt(tokenAmount.value.amount) > BigInt(0)) {
              setCh2Status('You are on the CH2 list!');
              fetchBalance();
            } else {
              setCh2Status('You are not on the CH2 list.');
            }
          } else {
            setCh2Status('You are not on the CH2 list.');
          }
        } catch (error) {
          console.error('Error checking CH2 token holding:', error);
          setCh2Status('Error checking CH2 status');
        }
      }
    }
    checkCh2TokenHolding();
  }, [walletAddress, connection, fetchBalance]);


  const handleTapToEarn = async () => {
    if (walletAddress) {
      setBalance(prevBalance => prevBalance + earnRate); // Optimistic update using earnRate
      setEarnAnimations(prev => [...prev, Date.now()]); // Add new animation
      const response = await fetch('/api/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await response.json();
      if (!response.ok) {
        setBalance(prevBalance => prevBalance - earnRate); // Revert optimistic update if failed
        console.error('Error updating balance:', data.error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {walletAddress ? (
          <>
            <h2 className="text-2xl mb-4">Hello {formatAddress(walletAddress)}</h2>
            {ch2Status && (
              <p className={`text-lg ${ch2Status === 'You are on the CH2 list!' ? 'text-green-500' : 'text-red-500'}`}>
                {ch2Status}
              </p>
            )}
            {ch2Status === 'You are on the CH2 list!' && (
              <>
                <p className="text-xl mt-4">Your Balance: {balance}</p>
                <p className="text-lg mt-2">Earn Rate: {earnRate}</p>
                <div className="relative mt-16 mb-8">
                  <button
                    onClick={handleTapToEarn}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold w-32 h-32 rounded-full text-xl flex items-center justify-center shadow-lg transform active:scale-95 transition-transform duration-100 ease-in-out"
                    style={{
                      boxShadow: '0 6px 0 #9b2c2c',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    Tap to Earn
                  </button>
                  <AnimatePresence>
                    {earnAnimations.map((id) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 0, y: '-100vh' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 3, ease: 'easeOut' }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        +{earnRate}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        ) : (
          <p>Connect your wallet to see a welcome message</p>
        )}
      </main>
    </div>
  );
}
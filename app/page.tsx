'use client';
import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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
            <h2 className="text-2xl mb-4">Hello {walletAddress}</h2>
            {ch2Status && (
              <p className={`text-lg ${ch2Status.includes('on the CH2 list') ? 'text-green-500' : 'text-red-500'}`}>
                {ch2Status}
              </p>
            )}
            {ch2Status && ch2Status.includes('on the CH2 list') && (
              <>
              <p className="text-xl mt-4">Your Balance: {balance}</p>
              <p className="text-lg mt-2">Earn Rate: {earnRate}</p>
              <button
                onClick={handleTapToEarn}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-xl"
              >
                Tap to Earn
              </button>
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
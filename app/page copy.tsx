'use client';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ch2Status, setCh2Status] = useState<string | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress(null);
      setCh2Status(null);
    }
  }, [publicKey]);

  useEffect(() => {
    async function checkCh2Status() {
      if (walletAddress) {
        try {
          const response = await fetch('/api/check-ch2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress }),
          });
          const data = await response.json();
          setCh2Status(data.message);
        } catch (error) {
          console.error('Error checking ch2 status:', error);
          setCh2Status('Error checking status');
        }
      }
    }
    checkCh2Status();
  }, [walletAddress]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <WalletMultiButton />
        </div>
        {walletAddress ? (
          <>
            <h2 className="text-2xl mb-4">Hello {walletAddress}</h2>
            {ch2Status && (
              <p className={`text-lg ${ch2Status.includes('present') ? 'text-green-500' : 'text-red-500'}`}>
                {ch2Status}
              </p>
            )}
          </>
        ) : (
          <p>Connect your wallet to see a welcome message</p>
        )}
      </main>
    </div>
  );
}
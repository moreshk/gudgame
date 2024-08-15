'use client';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress(null);
    }
  }, [publicKey]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <WalletMultiButton />
        </div>
        {walletAddress ? (
          <h2 className="text-2xl mb-4">Hello {walletAddress}</h2>
        ) : (
          <p>Connect your wallet to see a welcome message</p>
        )}
      </main>
    </div>
  );
}
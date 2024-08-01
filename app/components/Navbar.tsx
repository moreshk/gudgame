'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Dynamically import WalletMultiButton with ssr option set to false
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const Navbar = () => {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [showMyBets, setShowMyBets] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        <Link href="/">
          <Image 
            src="/logo.png" 
            alt="Pot Luck Fun Logo" 
            width={60} 
            height={60} 
            className="object-contain"
          />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/create-rps-bet" className="hover:text-gray-300">Create</Link>
        <Link href="/open-rps-bets" className="hover:text-gray-300">Open Games</Link>
        <div className="relative">
          <button 
            onClick={() => setShowMyBets(!showMyBets)}
            className="hover:text-gray-300"
          >
            My Games
          </button>
          {showMyBets && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1">
              <Link href="/made-bets" className="block px-4 py-2 text-sm hover:bg-gray-600">Made Games</Link>
              <Link href="/taken-bets" className="block px-4 py-2 text-sm hover:bg-gray-600">Taken Games</Link>
            </div>
          )}
        </div>
        <WalletMultiButtonDynamic className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" />
      </div>
    </nav>
  );
};

export default Navbar;
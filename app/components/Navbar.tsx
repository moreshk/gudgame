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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    // <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
     <nav className="flex justify-between items-center p-4 text-white">
      <div className="flex items-center">
        <Link href="/">
          <Image 
            src="/logo-beta.png" 
            alt="Gud Game" 
            width={60} 
            height={60} 
            className="object-contain"
          />
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <WalletMultiButtonDynamic className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" />
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {isMenuOpen && (
        // <div className="absolute top-16 right-0 w-64 bg-gray-800 rounded-md shadow-lg py-1">
                  <div className="absolute top-16 right-0 w-64 bg-gray-900 rounded-md shadow-lg py-1">
          <Link href="/" className="block py-2 px-4 hover:bg-gray-700">Create</Link>
          <Link href="/open-rps-games" className="block py-2 px-4 hover:bg-gray-700">Open Games</Link>

          <div>
            <button 
              onClick={() => setShowMyBets(!showMyBets)}
              className="w-full text-left py-2 px-4 hover:bg-gray-700"
            >
              My Games
            </button>
            {showMyBets && (
              <div className="bg-gray-800">
                <Link href="/made-games" className="block py-2 px-8 hover:bg-gray-600">Made Games</Link>
                <Link href="/taken-games" className="block py-2 px-8 hover:bg-gray-600">Taken Games</Link>
              </div>
            )}
          </div>

          <Link href="/leaderboard" className="block py-2 px-4 hover:bg-gray-700">Leaderboard</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
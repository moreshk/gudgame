'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

// Dynamically import WalletMultiButton with ssr option set to false
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const Navbar = () => {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <div className="text-xl font-bold">Pot Luck Fun</div>
      <div>
        <WalletMultiButtonDynamic className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" />
      </div>
    </nav>
  );
};

export default Navbar;
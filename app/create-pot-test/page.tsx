'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSolanaPotAddress } from '../server/createPot';
import Navbar from '../components/Navbar';

export default function CreatePot() {
  const { publicKey } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [createdAddress, setCreatedAddress] = useState<string | null>(null);

  const handleCreatePot = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createSolanaPotAddress();
      if (result.success) {
        setCreatedAddress(result.potAddress ?? null);
        alert(`Successfully created pot address: ${result.potAddress}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating pot address:', error);
      alert('Failed to create pot address');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-8">Create Pot Address</h1>
        {publicKey ? (
          <div className="w-full max-w-md">
            <button
              onClick={handleCreatePot}
              disabled={isCreating}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isCreating ? 'Creating...' : 'Create Pot Address'}
            </button>
            {createdAddress && (
              <p className="mt-4 text-center break-all">
                Created Address: {createdAddress}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xl text-center">Please connect your wallet to create a pot address</p>
        )}
      </main>
    </div>
  );
}
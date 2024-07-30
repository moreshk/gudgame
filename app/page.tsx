'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// import { LAMPORTS_PER_SOL, PublicKey, Transaction as web3Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import { createRecord } from './server/createRecord';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';


export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    const intervalId = setInterval(fetchBalance, 30000);

    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  const handleCreate = async () => {
    if (!publicKey || !connection) return;
  
    setIsCreating(true);
    try {
      const latestBlockhash = await connection.getLatestBlockhash();
  
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('9BAa8bSQrUAT3nipra5bt3DJbW2Wyqfc2SXw3vGcjpbj'),
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );
  
      const { signature } = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
  
      const result = await createRecord(publicKey.toString(), signature);
      if (result.success) {
        alert(`Record created with ID: ${result.id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create record');
    } finally {
      setIsCreating(false);
    }
  };

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
              <p className="text-xl mb-4">
                Your balance: {balance.toFixed(4)} SOL
              </p>
            ) : (
              <p className="text-xl mb-4">Loading balance...</p>
            )}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              {isCreating ? 'Creating...' : 'Create Record'}
            </button>
          </>
        ) : (
          <h1 className="text-3xl font-bold">Please connect your wallet</h1>
        )}
      </main>
    </div>
  );
}
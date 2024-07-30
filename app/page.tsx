'use client';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import { createGame } from './server/createGame';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import GameCreationForm from './components/GameCreationForm';

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

  const handleCreate = async (maxPossibilities: number, initialThreshold: number, maxRounds: number) => {
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
  
      const result = await createGame(
        maxPossibilities,
        initialThreshold,
        maxRounds,
        publicKey.toString(),
        signature
      );

      if (result.success) {
        alert(`Game created with ID: ${result.id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {publicKey ? (
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold mb-4 text-center">
              Welcome {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </h1>
            {balance !== null ? (
              <p className="text-xl mb-6 text-center">
                Your balance: {balance.toFixed(4)} SOL
              </p>
            ) : (
              <p className="text-xl mb-6 text-center">Loading balance...</p>
            )}
            <GameCreationForm onSubmit={handleCreate} isCreating={isCreating} />
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-center">Please connect your wallet</h1>
        )}
      </main>
    </div>
  );
}
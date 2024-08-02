'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import { createSolanaPotAddress } from './server/createPot';
import { createRPSBet } from './server/createRPSBet';
import { Press_Start_2P } from 'next/font/google';
const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

const HOUSE_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_ADDRESS || '9BAa8bSQrUAT3nipra5bt3DJbW2Wyqfc2SXw3vGcjpbj';

export default function CreateRPSBet() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState<'Rock' | 'Paper' | 'Scissors' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreate = async () => {
    if (!wallet.publicKey || !connection || !selectedBet || !amount) return;

    // Validate minimum bet amount
    if (parseFloat(amount) < 0.01) {
      setErrorMessage('Minimum bet amount is 0.01 SOL');
      return;
    }

    setIsCreating(true);
    setErrorMessage('');
    try {
      // Create pot address
      const potResult = await createSolanaPotAddress();
      if (!potResult.success || !potResult.potAddress) {
        throw new Error('Failed to create pot address');
      }

      // Create and send transaction
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;
      const potAmount = Math.floor(amountLamports * 0.9);
      const houseAmount = Math.floor(amountLamports * 0.1);

      const latestBlockhash = await connection.getLatestBlockhash();
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(potResult.potAddress),
          lamports: potAmount,
        }),
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(HOUSE_ADDRESS),
          lamports: houseAmount,
        })
      );

      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      // Create RPS bet
      const betResult = await createRPSBet({
        betMakerAddress: wallet.publicKey.toString(),
        makerSignature: signature,
        makerBet: selectedBet,
        betAmount: parseFloat(amount),
        potAddress: potResult.potAddress,
      });

      if (betResult.success) {
        router.push(`/rps-game/${betResult.id}`);
      } else {
        throw new Error(betResult.error);
      }
    } catch (error) {
      console.error('Error creating RPS bet:', error);
      setErrorMessage('Failed to create RPS game');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {wallet.publicKey ? (
          <div className="w-full max-w-md">
            {/* <h1 className="text-3xl font-bold mb-4 text-center">Rock, Paper, Scissor ... shoot!</h1> */}
            <h1 className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}>
  Create a game of Rock, Paper, Scissors!
</h1>
            {errorMessage && (
              <div className="mb-4 p-2 bg-red-500 text-white rounded">{errorMessage}</div>
            )}
            <div className="mb-4">
              {/* <label htmlFor="amount" className="block mb-2">Amount (SOL)</label> */}
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0.1"
                placeholder="Enter amount (min 0.1 SOL)"
              />
            </div>
            <label htmlFor="amount" className="block mb-2">Pick your move:</label>
            <div className="flex justify-between mb-4">
              {['Rock', 'Paper', 'Scissors'].map((bet) => (
                <button
                  key={bet}
                  onClick={() => setSelectedBet(bet as 'Rock' | 'Paper' | 'Scissors')}
                  className={`p-4 border rounded ${selectedBet === bet ? 'bg-blue-500' : 'bg-gray-700'} transition-colors`}
                >
                  <Image 
                    src={`/${bet.toLowerCase()}.png`} 
                    alt={bet} 
                    width={60} 
                    height={60}
                    className={`transition-opacity ${selectedBet === bet ? 'opacity-100' : 'opacity-70'}`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={isCreating || !selectedBet || !amount}
              className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isCreating ? 'Creating...' : 'Create Game'}
            </button>
            <p className="mt-4 text-center text-sm text-gray-400">
  Enter the amount you&apos;d like to put up and choose your move.<br />
  Other players will match and choose theirs.<br />
  Whoever wins gets the pot!
</p>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-center">Please connect your wallet</h1>
        )}
      </main>
    </div>
  );
}
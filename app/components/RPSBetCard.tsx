'use client';

import { useState } from 'react';
import { FaHandRock, FaHandPaper, FaHandScissors } from 'react-icons/fa';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getRPSBetById } from '../server/getRPSBetById';
import { updateRPSBet } from '../server/updateRPSBets';

const HOUSE_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_ADDRESS || '9BAa8bSQrUAT3nipra5bt3DJbW2Wyqfc2SXw3vGcjpbj';


interface RPSBetCardProps {
  bet: {
    id: number;
    bet_maker_address: string;
    bet_amount: number;
    pot_address: string;
  };
  wallet: WalletContextState;
  connection: Connection;
}

export default function RPSBetCard({ bet, wallet, connection }: RPSBetCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleBetTake = async (choice: 'Rock' | 'Paper' | 'Scissors') => {
      if (!wallet.publicKey || !connection) return;
  
      setIsProcessing(true);
      setError(null);
  
      try {
        // Fetch the full bet details
        const betDetails = await getRPSBetById(bet.id);
        if (!betDetails.success || !betDetails.bet) {
          throw new Error('Failed to fetch bet details');
        }
  
        // Calculate the amounts to send
        const totalAmount = bet.bet_amount * LAMPORTS_PER_SOL;
        const potAmount = Math.floor(totalAmount * 0.9);
        const houseAmount = Math.floor(totalAmount * 0.1);
  
        // Create and send transaction
        const latestBlockhash = await connection.getLatestBlockhash();
        const transaction = new Transaction({
          feePayer: wallet.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
        }).add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: new PublicKey(bet.pot_address),
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
  
        // Update the RPS bet
        const updateResult = await updateRPSBet({
          id: bet.id,
          betTakerAddress: wallet.publicKey.toString(),
          takerSignature: signature,
          takerBet: choice,
        });
  
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to update bet');
        }
  
        // Optionally, you can update the UI or redirect the user after successful bet taking
      } catch (error) {
        console.error('Error taking RPS bet:', error);
        setError('Failed to take bet. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <p className="text-lg font-semibold mb-2">Bet Amount: {bet.bet_amount} SOL</p>
      <p className="text-sm text-gray-400 mb-4">
        Maker: {bet.bet_maker_address.slice(0, 4)}...{bet.bet_maker_address.slice(-4)}
      </p>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <div className="flex justify-between">
        {['Rock', 'Paper', 'Scissors'].map((choice) => (
          <button
            key={choice}
            className="flex-1 mx-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-600"
            onClick={() => handleBetTake(choice as 'Rock' | 'Paper' | 'Scissors')}
            disabled={isProcessing || !wallet.publicKey}
          >
            {choice === 'Rock' && <FaHandRock className="mx-auto" />}
            {choice === 'Paper' && <FaHandPaper className="mx-auto" />}
            {choice === 'Scissors' && <FaHandScissors className="mx-auto" />}
          </button>
        ))}
      </div>
    </div>
  );
}
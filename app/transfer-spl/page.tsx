'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import Navbar from '../components/Navbar';

const HOUSE_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_ADDRESS || '9BAa8bSQrUAT3nipra5bt3DJbW2Wyqfc2SXw3vGcjpbj';
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // Mainnet USDC mint address

export default function USDCTransfer() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [isTransferring, setIsTransferring] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTransfer = async () => {
    if (!wallet.publicKey || !connection) return;

    setIsTransferring(true);
    setErrorMessage('');

    try {
      const amount = 10000; // 0.01 USDC (USDC has 6 decimal places)
      const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
      const toTokenAccount = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(HOUSE_ADDRESS));

      const transaction = new Transaction();

      // Check if the recipient's ATA exists, if not, add instruction to create it
      const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
      if (!toTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            toTokenAccount, // ata
            new PublicKey(HOUSE_ADDRESS), // owner
            USDC_MINT // mint
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          wallet.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = wallet.publicKey;
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      console.log('Transfer successful:', signature);
    } catch (error) {
      console.error('Error transferring USDC:', error);
      setErrorMessage('Failed to transfer USDC');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {wallet.publicKey ? (
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-center">Transfer 0.01 USDC</h1>
            {errorMessage && (
              <div className="mb-4 p-2 bg-red-500 text-white rounded">{errorMessage}</div>
            )}
            <button
              onClick={handleTransfer}
              disabled={isTransferring}
              className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-600 disabled:text-gray-400"
            >
              {isTransferring ? 'Transferring...' : 'Transfer 0.01 USDC'}
            </button>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-center">Please connect your wallet</h1>
        )}
      </main>
    </div>
  );
}
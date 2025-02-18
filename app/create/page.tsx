'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import dynamic from 'next/dynamic';
import CandlestickChart from '../components/CandlestickChart';
import Link from 'next/link';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const CH2_TOKEN_ADDRESS = 'Eyi4ZC14YyADn3P9tQ7oT5cmq6DCxBTt9ZLszdfX3mh2';

export default function CreatePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ch2Status, setCh2Status] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const fetchBalance = useCallback(async () => {
    if (walletAddress) {
      try {
        const response = await fetch(`/api/balance?wallet=${walletAddress}`);
        const data = await response.json();
        setBalance(data.balance !== undefined ? data.balance : null);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [walletAddress, fetchBalance]);

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress(null);
      setCh2Status(null);
    }
  }, [publicKey]);

  const checkCh2TokenHolding = useCallback(async () => {
    if (walletAddress) {
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(walletAddress),
          { programId: TOKEN_PROGRAM_ID }
        );

        const ch2TokenAccount = tokenAccounts.value.find(
          account => account.account.data.parsed.info.mint === CH2_TOKEN_ADDRESS
        );

        if (ch2TokenAccount) {
          const tokenAmount = await connection.getTokenAccountBalance(ch2TokenAccount.pubkey);
          if (BigInt(tokenAmount.value.amount) > BigInt(0)) {
            setCh2Status('You are on the CH2 list!');
          } else {
            setCh2Status('You are not on the CH2 list.');
          }
        } else {
          setCh2Status('You are not on the CH2 list.');
        }
      } catch (error) {
        console.error('Error checking CH2 token holding:', error);
        setCh2Status('Error checking CH2 status');
      }
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    checkCh2TokenHolding();
  }, [checkCh2TokenHolding]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {walletAddress ? (
          <>
            {ch2Status === 'You are on the CH2 list!' ? (
              <div className="p-4 max-w-4xl mx-auto">
                {balance === 0 ? (
                  <div className="p-4 text-center">
                    <h2 className="text-2xl font-bold mb-4 text-white">Insufficient Balance</h2>
                    <p className="text-white mb-4">You need to earn some balance first to play this game.</p>
                    <Link href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      Go to Home Page
                    </Link>
                  </div>
                ) : balance !== null ? (
                  <CandlestickChart 
                    startingPrice={balance} 
                    volatility={0.02} 
                    trend={0.3}
                    rng={balance}
                    walletAddress={walletAddress}
                    balance={balance}
                  />
                ) : (
                  <p className="text-white">Loading balance...</p>
                )}
              </div>
            ) : (
              <p className="text-xl text-gray-800">{ch2Status}</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-xl text-gray-800">Connect your wallet to access the chart</p>
            <WalletMultiButton />
          </div>
        )}
      </main>
    </div>
  );
}
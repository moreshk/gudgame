'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import dynamic from 'next/dynamic';
import CandlestickChart from '../components/CandlestickChart';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const CH2_TOKEN_ADDRESS = 'Eyi4ZC14YyADn3P9tQ7oT5cmq6DCxBTt9ZLszdfX3mh2';


interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  time: string;
}


export default function CreatePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ch2Status, setCh2Status] = useState<string | null>(null);
  const [startingPrice, setStartingPrice] = useState(100);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number>(100);

  const fetchBalance = useCallback(async () => {
    if (walletAddress) {
      try {
        const response = await fetch(`/api/balance?wallet=${walletAddress}`);
        const data = await response.json();
        setBalance(data.balance || 100);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(100);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

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

  const handleStartingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartingPrice(Number(e.target.value));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {walletAddress ? (
          <>
            {ch2Status === 'You are on the CH2 list!' ? (
              <div className="p-4 max-w-4xl mx-auto">


                <CandlestickChart startingPrice={balance} />
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
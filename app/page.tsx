'use client';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

const CH2_TOKEN_ADDRESS = 'Eyi4ZC14YyADn3P9tQ7oT5cmq6DCxBTt9ZLszdfX3mh2';

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ch2Status, setCh2Status] = useState<string | null>(null);
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    } else {
      setWalletAddress(null);
      setCh2Status(null);
    }
  }, [publicKey]);

  useEffect(() => {
    async function checkCh2TokenHolding() {
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
    }
    checkCh2TokenHolding();
  }, [walletAddress, connection]);


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {/* <div className="mb-8">
          <WalletMultiButton />
        </div> */}
        {walletAddress ? (
          <>
            <h2 className="text-2xl mb-4">Hello {walletAddress}</h2>
            {ch2Status && (
              <p className={`text-lg ${ch2Status.includes('on the CH2 list') ? 'text-green-500' : 'text-red-500'}`}>
                {ch2Status}
              </p>
            )}
          </>
        ) : (
          <p>Connect your wallet to see a welcome message</p>
        )}
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import Navbar from '../../components/Navbar';
import { createSolanaPotAddress } from '../../server/sol/createPot';
import { createRPSSplBet } from '../../server/spl/createRPSSplBet';
import { tokenData } from '../../tokenData';

import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

interface SPLToken {
  token_name: string;
  token_symbol: string;
  token_contract_address: string;
  token_decimals: number;
  token_image: string;
}


interface TokenOption {
  value: string;
  label: string;
  image: string;
}

const HOUSE_ADDRESS = process.env.NEXT_PUBLIC_HOUSE_ADDRESS || '9BAa8bSQrUAT3nipra5bt3DJbW2Wyqfc2SXw3vGcjpbj';

export default function CreateRPSBet() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [selectedBet, setSelectedBet] = useState<'Rock' | 'Paper' | 'Scissors' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [splTokens, setSplTokens] = useState<SPLToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenOption | null>(null);

  useEffect(() => {
    const tokens = tokenData.map(token => ({
      ...token,
      token_image: `/tokens/${encodeURIComponent(token.token_symbol.trim())}.png`
    }));
    setSplTokens(tokens);
  }, []);
  

  const tokenOptions: TokenOption[] = splTokens.map(token => ({
    value: token.token_contract_address,
    label: `${token.token_name} (${token.token_symbol})`,
    image: token.token_image
  }));

  const customStyles = {
    option: (provided: any, state: any) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      background: state.isFocused ? '#2a2a2a' : '#1a1a1a',
      color: 'white',
    }),
    control: (provided: any) => ({
      ...provided,
      background: '#1a1a1a',
      borderColor: '#3a3a3a',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'white',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'white',
    }),
    menu: (provided: any) => ({
      ...provided,
      background: '#1a1a1a',
    }),
  };

  const handleCreate = async () => {
    if (!wallet.publicKey || !connection || !selectedBet || !amount || !selectedToken) return;

    setIsCreating(true);
    setErrorMessage('');
    try {
      // Create pot address
      const potResult = await createSolanaPotAddress();
      if (!potResult.success || !potResult.potAddress) {
        throw new Error('Failed to create pot address');
      }

      const tokenMint = new PublicKey(selectedToken.value);
      const tokenDecimals = splTokens.find(token => token.token_contract_address === selectedToken.value)?.token_decimals || 6;
      const amountToSend = Math.floor(parseFloat(amount) * Math.pow(10, tokenDecimals));

      const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
      const potTokenAccount = await getAssociatedTokenAddress(tokenMint, new PublicKey(potResult.potAddress));
      const houseTokenAccount = await getAssociatedTokenAddress(tokenMint, new PublicKey(HOUSE_ADDRESS));

      const transaction = new Transaction();

      // Check if the pot's ATA exists, if not, add instruction to create it
      const potTokenAccountInfo = await connection.getAccountInfo(potTokenAccount);
      if (!potTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            potTokenAccount,
            new PublicKey(potResult.potAddress),
            tokenMint
          )
        );
      }

      // Check if the house's ATA exists, if not, add instruction to create it
      const houseTokenAccountInfo = await connection.getAccountInfo(houseTokenAccount);
      if (!houseTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            houseTokenAccount,
            new PublicKey(HOUSE_ADDRESS),
            tokenMint
          )
        );
      }

      // Add transfer instructions
      const potAmount = Math.floor(amountToSend * 0.9);
      const houseAmount = Math.floor(amountToSend * 0.1);

      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          potTokenAccount,
          wallet.publicKey,
          potAmount,
          [],
          TOKEN_PROGRAM_ID
        ),
        createTransferInstruction(
          fromTokenAccount,
          houseTokenAccount,
          wallet.publicKey,
          houseAmount,
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

      // Create RPS bet
      const betResult = await createRPSSplBet({
        betMakerAddress: wallet.publicKey.toString(),
        makerSignature: signature,
        makerBet: selectedBet,
        betAmount: parseFloat(amount),
        potAddress: potResult.potAddress,
        tokenMint: tokenMint.toString(),
        tokenDecimals: tokenDecimals,
      });

      if (betResult.success) {
        router.push(`/spl/rps-spl-game/${betResult.id}`);
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
      {isCreating && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Image src="/loading.gif" alt="Loading" width={100} height={100} />
          </div>
        )}
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
              <label htmlFor="token" className="block mb-2">Select SPL Token:</label>
              <Select
                id="token"
                options={tokenOptions}
                value={selectedToken}
                onChange={(option) => setSelectedToken(option as TokenOption)}
                styles={customStyles}
                placeholder="Select or search for a token"
                formatOptionLabel={(option: TokenOption) => (
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-2 flex-shrink-0">
                      <Image 
                        src={option.image} 
                        alt={option.label} 
                        width={24} 
                        height={24} 
                        className="object-contain"
                        onError={(e) => {
                          // Fallback to a default image if the token image is not found
                          (e.target as HTMLImageElement).src = '/default-token.png';
                        }}
                      />
                    </div>
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>
            <div className="mb-4">
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border rounded bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0.1"
                placeholder="Enter amount (min 0.01 SOL)"
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
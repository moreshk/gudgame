'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import { getRPSSplBetsByTaker } from '../../server/spl/getRPSSplBetsByTaker';
import { decryptBet } from '../../server/sol/decryptBet';
import Link from 'next/link';
import { Press_Start_2P } from 'next/font/google';
import { getTokenInfo } from '../../server/spl/getTokenInfo';

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

interface RPSSplBet {
  id: number;
  bet_maker_address: string | null;
  maker_bet: string;
  bet_amount: number;
  original_bet_amount: number;
  token_contract_address: string;
  token_decimals: number;
  bet_taking_timestamp: Date | null;
  bet_taker_address: string | null;
  taker_bet: string | null;
  winner_address: string | null;
}

interface DecryptedSplBet extends RPSSplBet {
  decryptedMakerBet: string | null;
  tokenSymbol: string;
}

export default function TakenSplRPSBets() {
  const { publicKey } = useWallet();
  const [takenBets, setTakenBets] = useState<DecryptedSplBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndDecryptBets() {
      if (!publicKey) {
        setIsLoading(false);
        return;
      }
      const result = await getRPSSplBetsByTaker(publicKey.toString());
      if (result.success) {
        const decryptedBets = await Promise.all((result.bets ?? []).map(async (bet) => {
          const decryptedMakerBet = await decryptBet(bet.maker_bet).catch(() => null);
          const tokenInfo = await getTokenInfo(bet.token_contract_address);
          const tokenSymbol = tokenInfo.success ? tokenInfo.tokenInfo?.token_symbol ?? 'SPL Token' : 'SPL Token';
          return { ...bet, decryptedMakerBet, tokenSymbol };
        }));
        setTakenBets(decryptedBets);
      } else {
        setError(result.error || 'Failed to fetch your taken SPL bets');
      }
      setIsLoading(false);
    }
    fetchAndDecryptBets();
  }, [publicKey]);

  const getBetIcon = (bet: string | null) => {
    switch (bet) {
      case 'Rock': return <Image src="/rock.png" alt="Rock" width={30} height={30} />;
      case 'Paper': return <Image src="/paper.png" alt="Paper" width={30} height={30} />;
      case 'Scissors': return <Image src="/scissors.png" alt="Scissors" width={30} height={30} />;
      default: return null;
    }
  };

  const getBetStatus = (bet: DecryptedSplBet) => {
    if (bet.winner_address === null) return 'In Progress';
    if (bet.winner_address === 'DRAW') return 'Draw';
    return bet.winner_address === bet.bet_taker_address ? 'Won' : 'Lost';
  };

  const formatTokenAmount = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toFixed(0);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          SPL Games Played
        </h1>

        {!publicKey && <p className="text-center">Please connect your wallet to view your taken SPL games.</p>}
        {isLoading && <p className="text-center">Loading your taken SPL games...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {takenBets.map((bet) => (
            <Link key={bet.id} href={`/spl/rps-spl-game/${bet.id}`}>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
                <p className="text-lg font-semibold mb-2">
                  {formatTokenAmount(bet.bet_amount, bet.token_decimals)} {bet.tokenSymbol}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  {bet.token_contract_address.slice(0, 4)}...{bet.token_contract_address.slice(-4)}
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Status: <span className={`font-bold ${
                    getBetStatus(bet) === 'Won' ? 'text-green-500' : 
                    getBetStatus(bet) === 'Lost' ? 'text-red-500' : 
                    getBetStatus(bet) === 'Draw' ? 'text-blue-500' : 
                    'text-yellow-500'
                  }`}>{getBetStatus(bet)}</span>
                </p>
                <div className="flex items-center mb-2">
                  <span className="mr-2">Your Choice:</span>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getBetIcon(bet.taker_bet)}
                  </div>
                </div>
                <div className="flex items-center mb-2">
                  <span className="mr-2">Opponent&aposs Choice:</span>
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getBetIcon(bet.decryptedMakerBet)}
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Taken: {bet.bet_taking_timestamp ? new Date(bet.bet_taking_timestamp).toLocaleString() : 'N/A'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { getRPSBetsByTaker } from '../server/getRPSBetsByTaker';
import { decryptBet } from '../server/decryptBet';
import Link from 'next/link';

import { Press_Start_2P } from 'next/font/google';
const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_bet: string; // Encrypted
  bet_amount: number;
  bet_taking_timestamp: Date;
  bet_taker_address: string;
  taker_bet: string; // Encrypted
  winner_address: string | null;
}

interface DecryptedBet extends Omit<RPSBet, 'bet_taking_timestamp' | 'bet_taker_address' | 'taker_bet'> {
    decryptedMakerBet: string | null;
    bet_taking_timestamp: Date | null;
    bet_taker_address: string | null;
    taker_bet: string | null;
}


export default function TakenRPSBets() {
  const { publicKey } = useWallet();
  const [takenBets, setTakenBets] = useState<DecryptedBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndDecryptBets() {
      if (!publicKey) {
        setIsLoading(false);
        return;
      }
      const result = await getRPSBetsByTaker(publicKey.toString());
      if (result.success) {
        const decryptedBets = await Promise.all((result.bets ?? []).map(async (bet) => {
            const decryptedMakerBet = bet.maker_bet ? await decryptBet(bet.maker_bet).catch(() => null) : null;
            return { ...bet, decryptedMakerBet };
        }));
        setTakenBets(decryptedBets);
      } else {
        setError(result.error || 'Failed to fetch your taken bets');
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

  const getBetStatus = (bet: DecryptedBet) => {
    if (bet.winner_address === null) return 'In Progress';
    if (bet.winner_address === 'DRAW') return 'Draw';
    return bet.winner_address === bet.bet_taker_address ? 'Won' : 'Lost';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        
      <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          Games Played
        </h1>

        {/* <h1 className="text-3xl font-bold mb-8 text-center">Games Played</h1> */}
        {!publicKey && <p className="text-center">Please connect your wallet to view your taken games.</p>}
        {isLoading && <p className="text-center">Loading your taken games...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {takenBets.map((bet) => (
            <Link key={bet.id} href={`/rps-game/${bet.id}`}>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
                <p className="text-lg font-semibold mb-2">Game Amount: {Number(bet.bet_amount).toFixed(2)} SOL</p>
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
                  <span className="mr-2">Opponent&apos;s Choice:</span>
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
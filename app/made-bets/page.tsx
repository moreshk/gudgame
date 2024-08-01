'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { getRPSBetsByMaker } from '../server/getRPSBetsByMaker';
import { decryptBet } from '../server/decryptBet';
import Link from 'next/link';


interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_bet: string; // Now encrypted
  bet_amount: number;
  bet_making_timestamp: Date;
  bet_taker_address: string | null;
  taker_bet: string | null; // Now encrypted
  winner_address: string | null;
}

interface DecryptedBet extends RPSBet {
    decryptedMakerBet: string | null;
  }
  
export default function MyRPSBets() {
  const { publicKey } = useWallet();
  const [myBets, setMyBets] = useState<DecryptedBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndDecryptBets() {
      if (!publicKey) {
        setIsLoading(false);
        return;
      }
      const result = await getRPSBetsByMaker(publicKey.toString());
      if (result.success) {
        const decryptedBets = await Promise.all((result.bets ?? []).map(async (bet) => {
          const decryptedMakerBet = await decryptBet(bet.maker_bet).catch(() => null);
          return { ...bet, decryptedMakerBet };
        }));
        setMyBets(decryptedBets);
      } else {
        setError(result.error || 'Failed to fetch your bets');
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
    if (!bet.bet_taker_address) return 'Open';
    if (bet.winner_address === null) return 'In Progress';
    return bet.winner_address === bet.bet_maker_address ? 'Won' : 'Lost';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Games Created</h1>
        {!publicKey && <p className="text-center">Please connect your wallet to view your bets.</p>}
        {isLoading && <p className="text-center">Loading your bets...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {myBets.map((bet) => (
    <Link key={bet.id} href={`/rps-bet/${bet.id}`}>
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
        <p className="text-lg font-semibold mb-2">Game Amount: {Number(bet.bet_amount).toFixed(2)} SOL</p>
        <p className="text-sm text-gray-400 mb-2">
          Status: <span className={`font-bold ${getBetStatus(bet) === 'Won' ? 'text-green-500' : getBetStatus(bet) === 'Lost' ? 'text-red-500' : 'text-yellow-500'}`}>{getBetStatus(bet)}</span>
        </p>
        <div className="flex items-center mb-2">
          <span className="mr-2">Your Choice:</span>
          <div className="w-8 h-8 flex items-center justify-center">
            {getBetIcon(bet.decryptedMakerBet)}
          </div>
        </div>
        {bet.taker_bet && (
          <div className="flex items-center mb-2">
            <span className="mr-2">Opponent&apos;s Choice:</span>
            <div className="w-8 h-8 flex items-center justify-center">
              {getBetIcon(bet.taker_bet)}
            </div>
          </div>
        )}
        <p className="text-sm text-gray-400">
          Created: {new Date(bet.bet_making_timestamp).toLocaleString()}
        </p>
      </div>
    </Link>
  ))}
</div>
      </main>
    </div>
  );
}
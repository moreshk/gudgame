'use client';

import { useState, useEffect } from 'react';
import { FaHandRock, FaHandPaper, FaHandScissors } from 'react-icons/fa';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getOpenRPSBets } from '../server/getOpenRPSBets';

interface OpenRPSBet {
  id: number;
  bet_maker_address: string;
  bet_amount: number;
  pot_address: string;
  bet_making_timestamp: Date;
}

export default function OpenRPSBets() {
  const [openBets, setOpenBets] = useState<OpenRPSBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOpenBets() {
      const result = await getOpenRPSBets();
      if (result.success) {
        setOpenBets(result.bets ?? []);
      } else {
        setError(result.error || 'Failed to fetch open bets');
      }
      setIsLoading(false);
    }
    fetchOpenBets();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Open RPS Bets</h1>
        {isLoading && <p className="text-center">Loading open bets...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {openBets.map((bet) => (
            <Link key={bet.id} href={`/rps-bet/${bet.id}`}>
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
                <p className="text-lg font-semibold mb-2">Bet Amount: {bet.bet_amount} SOL</p>
                <p className="text-sm text-gray-400 mb-4">
                  Maker: {bet.bet_maker_address.slice(0, 4)}...{bet.bet_maker_address.slice(-4)}
                </p>
                <div className="flex justify-between">
                  {['Rock', 'Paper', 'Scissors'].map((choice) => (
                    <button
                      key={choice}
                      className="flex-1 mx-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        // Add logic here to handle bet taking
                      }}
                    >
                      {choice === 'Rock' && <FaHandRock className="mx-auto" />}
                      {choice === 'Paper' && <FaHandPaper className="mx-auto" />}
                      {choice === 'Scissors' && <FaHandScissors className="mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
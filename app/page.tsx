'use client';

import { useState, useEffect } from 'react';
import { getEarliestOpenRPSBet } from './server/getEarliestOpenBet';
import RPSBetDetails from './components/RPSBetDetails';
import Navbar from './components/Navbar';

export default function EarliestOpenBet() {
  const [betId, setBetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarliestOpenBet() {
      try {
        const result = await getEarliestOpenRPSBet();
        if (result.success && result.betId) {
          setBetId(result.betId);
        } else {
          setError(result.error || 'No open bets found');
        }
      } catch (err) {
        setError('Failed to fetch the earliest open bet');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEarliestOpenBet();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-8">Earliest Open Bet</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : betId ? (
          <RPSBetDetails id={betId} />
        ) : (
          <p>No open bets found</p>
        )}
      </main>
    </div>
  );
}
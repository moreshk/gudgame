'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '../../components/Navbar';
import { getRPSBetById } from '../../server/getRPSBetById';
import { resolveRPSBet } from '../../server/resolveRPSBet';
import BetOptions from '../../components/BetOptions';
import { FaHandRock, FaHandPaper, FaHandScissors } from 'react-icons/fa';

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_signature: string;
  maker_bet: 'Rock' | 'Paper' | 'Scissors';
  pot_address: string;
  bet_amount: number;
  bet_making_timestamp: Date;
  bet_taker_address: string | null;
  taker_signature: string | null;
  taker_bet: 'Rock' | 'Paper' | 'Scissors' | null;
  bet_taking_timestamp: Date | null;
  winner_address: string | null;
  winnings_disbursement_signature: string | null;
}

export default function RPSBetDetails() {
  const { id } = useParams();
  const [bet, setBet] = useState<RPSBet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();

  useEffect(() => {
    async function fetchBet() {
      if (id) {
        const result = await getRPSBetById(Number(id));
        if (result.success && result.bet) {
          setBet(result.bet);
        } else {
          setError(result.error || 'Failed to fetch bet details');
        }
        setIsLoading(false);
      }
    }
    fetchBet();
  }, [id]);

  const handleBetPlaced = async () => {
    if (id) {
      setIsResolving(true);
      const result = await getRPSBetById(Number(id));
      if (result.success && result.bet) {
        setBet(result.bet);
        if (result.bet.bet_taker_address && result.bet.taker_bet) {
          const resolveResult = await resolveRPSBet(Number(id));
          if (resolveResult.success) {
            const updatedResult = await getRPSBetById(Number(id));
            if (updatedResult.success && updatedResult.bet) {
              setBet(updatedResult.bet);
            }
          } else {
            setError(resolveResult.error || 'Failed to resolve bet');
          }
        }
      }
      setIsResolving(false);
    }
  };

  const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleString();

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">RPS Bet Details</h1>
        {isLoading && <p className="text-center">Loading bet details...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {isResolving && (
          <div className="text-center">
            <p className="mb-4">Bet resolving, please wait...</p>
            <div className="flex justify-center space-x-4 text-4xl animate-pulse">
              <FaHandRock />
              <FaHandPaper />
              <FaHandScissors />
            </div>
          </div>
        )}
        {bet && !isResolving && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Bet #{bet.id}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Bet Amount:</p>
                <p>{bet.bet_amount} SOL</p>
              </div>
              <div>
                <p className="font-semibold">Pot Address:</p>
                <p className="break-all">{bet.pot_address}</p>
              </div>
              <div>
                <p className="font-semibold">Maker Address:</p>
                <p className="break-all">{formatAddress(bet.bet_maker_address)}</p>
              </div>
              <div>
                <p className="font-semibold">Bet Making Time:</p>
                <p>{formatDate(bet.bet_making_timestamp)}</p>
              </div>
              {bet.bet_taker_address && (
                <>
                  <div>
                    <p className="font-semibold">Taker Address:</p>
                    <p className="break-all">{formatAddress(bet.bet_taker_address)}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Taker Bet:</p>
                    <p>{bet.taker_bet || 'Not revealed'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Bet Taking Time:</p>
                    <p>{bet.bet_taking_timestamp ? formatDate(bet.bet_taking_timestamp) : 'N/A'}</p>
                  </div>
                </>
              )}
              {bet.winner_address && (
                <>
                  <div>
                    <p className="font-semibold">Winner:</p>
                    <p className="break-all">{formatAddress(bet.winner_address)}</p>
                  </div>
                  {bet.winnings_disbursement_signature && (
                    <div>
                      <p className="font-semibold">Winnings Disbursement Signature:</p>
                      <p className="break-all">{bet.winnings_disbursement_signature}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {!bet.bet_taker_address && wallet.connected && (
              <BetOptions
                betId={bet.id}
                betAmount={bet.bet_amount}
                potAddress={bet.pot_address}
                onBetPlaced={handleBetPlaced}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
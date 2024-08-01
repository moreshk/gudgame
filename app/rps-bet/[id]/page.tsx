"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../../components/Navbar";
import { getRPSBetById } from "../../server/getRPSBetById";
import { resolveRPSBet } from "../../server/resolveRPSBet";
import BetOptions from "../../components/BetOptions";
import { FaHandRock, FaHandPaper, FaHandScissors } from "react-icons/fa";

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_signature: string;
  maker_bet: "Rock" | "Paper" | "Scissors";
  pot_address: string;
  bet_amount: number;
  bet_making_timestamp: Date;
  bet_taker_address: string | null;
  taker_signature: string | null;
  taker_bet: "Rock" | "Paper" | "Scissors" | null;
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
          setError(result.error || "Failed to fetch game details");
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
            setError(resolveResult.error || "Failed to resolve bet");
          }
        }
      }
      setIsResolving(false);
    }
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleString();
  const formatSignature = (signature: string) =>
    `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Navbar />
      {/* <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Rock Paper Scissor Game Details 
        </h1> */}
        <main className="flex-grow container mx-auto px-4 py-8">
      {/* <h1 className="text-3xl font-bold mb-8 text-center">
        Rock Paper Scissor Game by {bet ? formatAddress(bet.bet_maker_address) : 'Loading...'}
      </h1> */}
       <h1 className="text-3xl font-bold mb-8 text-center">
        {bet ? (
          <>
            <a
              href={`https://solscan.io/account/${bet.bet_maker_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              {formatAddress(bet.bet_maker_address)}
            </a>{' '}
            has started a game of Rock Paper Scissors
          </>
        ) : (
          'Loading...'
        )}
      </h1>
        {isLoading && <p className="text-center">Loading Game details...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {isResolving && (
          <div className="text-center">
            <p className="mb-4">Game resolving, please wait...</p>
            <div className="flex justify-center space-x-4 text-4xl animate-pulse">
              <FaHandRock />
              <FaHandPaper />
              <FaHandScissors />
            </div>
          </div>
        )}
        {bet && !isResolving && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* <h2 className="text-2xl font-semibold mb-4">Game #{bet.id}</h2> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* <p className="font-semibold">Game Amount:</p>
                <p>{bet.bet_amount} SOL</p> */}
                <p className="text-lg font-semibold mb-2">Game Amount: {Number(bet.bet_amount).toFixed(2)} SOL</p>

              </div>
              <div>
                <p className="font-semibold">Pot Address:</p>
                <a
                  href={`https://solscan.io/account/${bet.pot_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {formatAddress(bet.pot_address)}
                </a>
              </div>
              {/* <div>
                <p className="font-semibold">Maker Address:</p>
                <a
                  href={`https://solscan.io/account/${bet.bet_maker_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {formatAddress(bet.bet_maker_address)}
                </a>
              </div> */}
              {/* <div>
                <p className="font-semibold">Bet Making Time:</p>
                <p>{formatDate(bet.bet_making_timestamp)}</p>
              </div> */}
              {bet.bet_taker_address && (
                <>
                  <div>
                    <p className="font-semibold">Taker Address:</p>
                    <a
                      href={`https://solscan.io/account/${bet.bet_taker_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all"
                    >
                      {formatAddress(bet.bet_taker_address)}
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold">Taker Move:</p>
                    <p>{bet.taker_bet || "Not revealed"}</p>
                  </div>
                  {/* <div>
                    <p className="font-semibold">Taking Time:</p>
                    <p>
                      {bet.bet_taking_timestamp
                        ? formatDate(bet.bet_taking_timestamp)
                        : "N/A"}
                    </p>
                  </div> */}
                </>
              )}
              {bet.winner_address && (
                <>
                  <div>
                    <p className="font-semibold">Winner:</p>
                    <a
                      href={`https://solscan.io/account/${bet.winner_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 break-all"
                    >
                      {formatAddress(bet.winner_address)}
                    </a>
                  </div>
                  {bet.winnings_disbursement_signature && (
                    <div>
                      <p className="font-semibold">Winnings Disbursement:</p>
                      <a
                        href={`https://solscan.io/tx/${bet.winnings_disbursement_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {formatSignature(bet.winnings_disbursement_signature)}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <BetOptions
                betId={bet.id}
                betAmount={bet.bet_amount}
                potAddress={bet.pot_address}
                onBetPlaced={handleBetPlaced}
              />
          </div>
        )}
      </main>
    </div>
  );
}

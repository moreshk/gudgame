"use client";
// dummy
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../../components/Navbar";
import { getRPSBetById } from "../../server/getRPSBetById";
import { resolveRPSBet } from "../../server/resolveRPSBet";
import BetOptions from "../../components/BetOptions";
import { FaHandRock, FaHandPaper, FaHandScissors } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa"; // Add this import

import Link from "next/link"; // Add this import at the top of the file

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
  const isResolved =
    bet?.winner_address !== null ||
    bet?.winnings_disbursement_signature !== null;

  // const getResultMessage = () => {
  //   if (!bet || !wallet.publicKey) return "";
  //   if (bet.winner_address === "DRAW") return "It's a draw!";
  //   if (bet.winner_address === wallet.publicKey.toBase58())
  //     return "You won! 🎉";
  //   return "You lost 😢";
  // };

  const getResultMessage = () => {
    if (!bet || !wallet.publicKey) return "";
    const amount = Number(bet.bet_amount);
    if (bet.winner_address === "DRAW") return "It's a draw!";
    if (bet.winner_address === wallet.publicKey.toBase58())
      return `You won ${(amount * 2).toFixed(2)} SOL! 🎉`;
    return `You lost ${amount.toFixed(2)} SOL 😢`;
  };
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
      try {
        const result = await getRPSBetById(Number(id));
        if (result.success && result.bet) {
          setBet(result.bet);
          if (result.bet.bet_taker_address && result.bet.taker_bet) {
            const resolveResult = await resolveRPSBet(Number(id));
            if (resolveResult && resolveResult.success) {
              const updatedResult = await getRPSBetById(Number(id));
              if (updatedResult.success && updatedResult.bet) {
                setBet(updatedResult.bet);
              } else {
                throw new Error(updatedResult.error || "Failed to fetch updated bet");
              }
            } else {
              throw new Error(resolveResult?.error || "Failed to resolve bet");
            }
          }
        } else {
          throw new Error(result.error || "Failed to fetch bet");
        }
      } catch (error) {
        console.error("Error handling bet placement:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setIsResolving(false);
      }
    }
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;
  const formatDate = (date: Date) => new Date(date).toLocaleString();
  const formatSignature = (signature: string) =>
    `${signature.slice(0, 4)}...${signature.slice(-4)}`;

  const shareOnTwitter = () => {
    if (bet && wallet.publicKey) {
      const formattedAmount = Number(bet.bet_amount * 2).toFixed(2);
      let tweetText = "";

      if (!bet.bet_taker_address) {
        tweetText = `Play me in Rock Paper Scissors @gudgamelol! Winner gets ${formattedAmount} SOL - ${window.location.href}`;
      } else if (bet.winner_address) {
        if (bet.winner_address === "DRAW") {
          tweetText = `I just drew a game of Rock Paper Scissors on @gudgamelol! What are the odds? Check it out: www.gudgame.lol`;
        } else if (bet.winner_address === wallet.publicKey.toBase58()) {
          tweetText = `I just won ${formattedAmount} SOL playing Rock Paper Scissors on @gudgamelol! 🎉 Want to challenge me? www.gudgame.lol`;
        } else {
          tweetText = `I just lost a nail-biting game of Rock Paper Scissors on @gudgamelol. Ready for a rematch? www.gudgame.lol`;
        }
      }

      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        tweetText
      )}`;
      window.open(twitterUrl, "_blank");
    }
  };

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
          {isLoading ? (
            "Loading..."
          ) : bet ? (
            isResolved ? (
              getResultMessage()
            ) : (
              <>
                <a
                  href={`https://solscan.io/account/${bet.bet_maker_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {formatAddress(bet.bet_maker_address)}
                </a>{" "}
                has started a game of Rock Paper Scissors
              </>
            )
          ) : (
            "Game not found"
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
          <>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              {/* <h2 className="text-2xl font-semibold mb-4">Game #{bet.id}</h2> */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
              <p className="font-semibold mb-2">
                Game Amount: {isResolved 
                  ? (bet.winner_address === "DRAW" 
                    ? Number(bet.bet_amount).toFixed(2) 
                    : (bet.winner_address === wallet.publicKey?.toBase58() 
                      ? (Number(bet.bet_amount) * 2).toFixed(2) 
                      : Number(bet.bet_amount).toFixed(2)))
                  : Number(bet.bet_amount).toFixed(2)} SOL
              </p>
            </div>
                <div>
                  <p className="font-semibold flex items-center justify-start md:justify-end">
                    <span className="mr-2">Pot Address:</span>
                    <a
                      href={`https://solscan.io/account/${bet.pot_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {formatAddress(bet.pot_address)}
                    </a>
                  </p>
                </div>

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
                      <div className="text-left md:text-right">
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

              {!isResolved && ( // Only render BetOptions if the bet is not resolved
                <>
                  <BetOptions
                    betId={bet.id}
                    betAmount={bet.bet_amount}
                    potAddress={bet.pot_address}
                    onBetPlaced={handleBetPlaced}
                    isResolved={isResolved} // Pass the new prop
                  />
                  <p className="mt-4 text-center text-sm text-gray-400">
                    Choose your move and match the game amount. Whoever wins
                    gets the pot! <br />
                    Winnings are automatically sent to the winning wallet
                    address.
                  </p>
                </>
              )}
            </div>

            {bet && !isResolving && (
              <>
                <div className="mt-6 text-center space-y-4">
                  {isResolved && (
                    <Link
                      href="/"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-block"
                    >
                      Start New Game
                    </Link>
                  )}
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={shareOnTwitter}
                className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <FaTwitter className="mr-2" />
                Share on X
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

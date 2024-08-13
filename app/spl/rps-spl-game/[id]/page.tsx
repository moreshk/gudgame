"use client";

import { useState, useEffect } from "react";
import { formatAddress, formatDate, formatSignature, formatTokenAmount } from "../../../utils/formatters";
import { getBetIcon } from "../../../utils/betIcons";
import { shareGame, shareOnTwitter } from "../../../utils/shareUtils";

import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Navbar from "../../../components/Navbar";
import { getRPSSplBetById } from "../../../server/spl/getRPSSplBetById";
import {
  resolveRPSBet,
  completeRPSBetResolution,
} from "../../../server/sol/resolveRPSBet";
import BetSPLOptions from "../../../components/BetSPLOptions";
import {
  FaHandRock,
  FaHandPaper,
  FaHandScissors,
  FaTwitter,
  FaShare,
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { decryptBet } from "../../../server/sol/decryptBet";
import BetsByAddress from "../../../components/BetsByAddress";

import { Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

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
  token_contract_address: string;
  token_symbol: string;
  token_decimals: number;
}

export default function RPSBetDetails() {
  const { id } = useParams();
  const [bet, setBet] = useState<RPSBet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameOutcome, setGameOutcome] = useState<string | null>(null);
  const [isFundsPending, setIsFundsPending] = useState(false);
  const [isFundsTransferring, setIsFundsTransferring] = useState(false);
  const wallet = useWallet();
  const [decryptedMakerBet, setDecryptedMakerBet] = useState<string | null>(
    null
  );

  const [showShareButton, setShowShareButton] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");

  const handleShareGame = () => {
    shareGame(id as string, setShowShareButton, setCopyMessage);
  };

  const handleShareOnTwitter = () => {
    shareOnTwitter(bet, wallet);
  };
  


  const isResolved =
    bet?.winner_address !== null ||
    bet?.winnings_disbursement_signature !== null;

    const formatTokenAmount = (amount: number, decimals: number) => {
      const factor = Math.pow(10, decimals);
      return Math.floor(amount / factor).toString();
    };
  

  useEffect(() => {
    async function fetchBet() {
      if (id) {
        const result = await getRPSSplBetById(Number(id));
        if (result.success && result.bet) {
          setBet(result.bet);
        } else {
          setError(result.error || "Failed to fetch game details");
        }
        setIsLoading(false);

        if (result.success && result.bet) {
          setBet(result.bet);
          if (result.bet.maker_bet) {
            try {
              const decrypted = await decryptBet(result.bet.maker_bet);
              setDecryptedMakerBet(decrypted);
            } catch (error) {
              console.error("Failed to decrypt maker's bet:", error);
            }
          }
        }
      }
    }
    fetchBet();
  }, [id]);

  const handleBetPlaced = async () => {
    if (id) {
      setIsResolving(true);
      try {
        const result = await getRPSSplBetById(Number(id));
        if (result.success && result.bet) {
          setBet(result.bet);
          if (result.bet.bet_taker_address && result.bet.taker_bet) {
            // Resolve the bet and get the winner immediately
            const resolveResult = await resolveRPSBet(Number(id));
            if (
              resolveResult &&
              resolveResult.success &&
              resolveResult.winner
            ) {
              setGameOutcome(resolveResult.winner);
              setIsResolving(false);
              setIsFundsTransferring(true);

              // Continue with the fund transfer and database update in the background
              const finalResult = await completeRPSBetResolution(
                Number(id),
                resolveResult.winner,
                resolveResult.option!
              );
              if (finalResult.success) {
                const updatedResult = await getRPSSplBetById(Number(id));
                if (updatedResult.success && updatedResult.bet) {
                  setBet(updatedResult.bet);
                }
              }
              setIsFundsTransferring(false);
            } else {
              throw new Error(resolveResult?.error || "Failed to resolve bet");
            }
          }
        } else {
          throw new Error(result.error || "Failed to fetch bet");
        }
      } catch (error) {
        console.error("Error handling bet placement:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setIsResolving(false);
        setIsFundsTransferring(false);
      }
    }
  };

  const getOutcomeMessage = () => {
    if (!bet || !wallet.publicKey) return "";
    const amount = Number(bet.bet_amount);
    const winnerAddress = gameOutcome || bet.winner_address;
    if (winnerAddress === "DRAW") return "It's a draw!";
    if (winnerAddress === wallet.publicKey.toBase58())
      return `You won ${(amount * 2).toFixed(2)} SOL! 🎉`;
    return `You lost ${amount.toFixed(2)} SOL 😢`;
  };

  const getResultMessage = () => {
    if (!bet || !wallet.publicKey) return "";
    const amount = Number(bet.bet_amount);
    const winnerAddress = gameOutcome || bet.winner_address;
    if (winnerAddress === "DRAW") return "It's a draw!";
    if (winnerAddress === wallet.publicKey.toBase58())
      return `You won ${(amount * 2).toFixed(2)} SOL! 🎉`;
    return `You lost ${amount.toFixed(2)} SOL 😢`;
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-center">
          {isLoading ? (
            "Loading..."
          ) : bet ? (
            gameOutcome || isResolved ? (
              getResultMessage()
            ) : (
              <span
                className={`${pressStart2P.className} text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed`}
              >
                <a
                  href={`https://solscan.io/account/${bet.bet_maker_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {formatAddress(bet.bet_maker_address)}
                </a>{" "}
                has started a game of Rock Paper Scissors
              </span>
            )
          ) : (
            "Game not found"
          )}
        </h1>
        {isLoading && <p className="text-center">Loading Game details...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {isResolving && !gameOutcome && (
          <div className="text-center">
            <p className="mb-4">Game resolving, please wait...</p>
            <div className="flex justify-center">
              <Image
                src="/loading.gif"
                alt="Loading"
                width={180}
                height={180}
              />
            </div>
          </div>
        )}
        {gameOutcome && (
          <div className="text-center mt-4">
            <p>{getOutcomeMessage()}</p>
            {isFundsTransferring && <p>Funds are being transferred...</p>}
          </div>
        )}

        {bet && !isResolving && (
          <>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="font-semibold mb-2">
                    Game Amount:{" "}
                    {isResolved
                      ? bet.winner_address === "DRAW"
                        ? formatTokenAmount(bet.bet_amount, bet.token_decimals)
                        : bet.winner_address === wallet.publicKey?.toBase58()
                        ? formatTokenAmount(
                            bet.bet_amount * 2,
                            bet.token_decimals
                          )
                        : formatTokenAmount(bet.bet_amount, bet.token_decimals)
                      : formatTokenAmount(
                          bet.bet_amount,
                          bet.token_decimals
                        )}{" "}
                    {bet.token_symbol}
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

                {(bet.winner_address || gameOutcome) && (
                  <>
                    <div>
                      <p className="font-semibold">Winner:</p>
                      <a
                        href={`https://solscan.io/account/${
                          bet.winner_address || gameOutcome
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all"
                      >
                        {formatAddress(bet.winner_address || gameOutcome || "")}
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

              {(bet.winner_address || gameOutcome) && (
                <div className="mt-6 flex flex-col items-center">
                  <div className="flex justify-center items-center space-x-16">
                    <div className="text-center">
                      <p className="mb-2">Maker&apos;s Move</p>
                      <div className="transform scale-x-[-1]">
                        {getBetIcon(decryptedMakerBet)}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="mb-2">Taker&apos;s Move</p>
                      {getBetIcon(bet.taker_bet)}
                    </div>
                  </div>
                </div>
              )}

              {!isResolved && !gameOutcome && (
                <>
                  <BetSPLOptions
                    betId={bet.id}
                    betAmount={bet.bet_amount}
                    potAddress={bet.pot_address}
                    onBetPlaced={handleBetPlaced}
                    isResolved={isResolved}
                    tokenContractAddress={bet.token_contract_address}
                  />
                  <p className="mt-4 text-center text-sm text-gray-400">
                    Choose your move and match the game amount. Whoever wins
                    gets the pot! <br />
                    Winnings are automatically sent to the winning wallet
                    address.
                  </p>
                  <div className="my-8">
                    {" "}
                    {/* Added spacing */}
                    <BetsByAddress address={bet.bet_maker_address} />
                  </div>
                  {/* <BetsByAddress address={bet.bet_maker_address} /> */}
                </>
              )}
            </div>

            {(isResolved || gameOutcome) && (
              <div className="mt-6 text-center space-y-4">
                <Link
                  href="/"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-block"
                >
                  Start New Game
                </Link>
              </div>
            )}

            <div className="mt-6 text-center space-x-4">
              <button
                onClick={handleShareOnTwitter}
                className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <FaTwitter className="mr-2" />
                Share on X
              </button>
              {showShareButton ? (
      <button onClick={handleShareGame}>
        <FaShare className="mr-2" />
        Share Game
      </button>
    ) : (
      <span className="text-green-400">{copyMessage}</span>
    )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

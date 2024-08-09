"use client";

import { useState, useEffect } from "react";
import { FaShare } from "react-icons/fa";

import { useWallet } from "@solana/wallet-adapter-react";
import { getRPSBetById } from "../server/getRPSBetById";
import {
  resolveRPSBet,
  completeRPSBetResolution,
} from "../server/resolveRPSBet";
import BetOptions from "./BetOptions";
import {
  FaHandRock,
  FaHandPaper,
  FaHandScissors,
  FaTwitter,
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { decryptBet } from "../server/decryptBet";
import BetsByAddress from "./BetsByAddress";

import { Press_Start_2P } from "next/font/google";
import { useRouter } from "next/navigation";

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
}

interface RPSBetDetailsProps {
  id: number;
}

export default function RPSBetDetails({ id }: RPSBetDetailsProps) {
  const router = useRouter();
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

  const shareGame = () => {
    const gameUrl = `https://www.gudgame.lol/rps-game/${id}`;
    navigator.clipboard.writeText(gameUrl).then(() => {
      setShowShareButton(false);
      setCopyMessage("Game link copied. You can send it to your friends.");
      setTimeout(() => {
        setShowShareButton(true);
        setCopyMessage("");
      }, 3000);
    });
  };

  const isResolved =
    bet?.winner_address !== null ||
    bet?.winnings_disbursement_signature !== null;

  useEffect(() => {
    async function fetchBet() {
      const result = await getRPSBetById(id);
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
      } else {
        setError(result.error || "Failed to fetch game details");
      }
      setIsLoading(false);
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
                const updatedResult = await getRPSBetById(Number(id));
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

  const getBetIcon = (bet: string | null) => {
    switch (bet) {
      case "Rock":
        return <Image src="/rock.png" alt="Rock" width={50} height={50} />;
      case "Paper":
        return <Image src="/paper.png" alt="Paper" width={50} height={50} />;
      case "Scissors":
        return (
          <Image src="/scissors.png" alt="Scissors" width={50} height={50} />
        );
      default:
        return null;
    }
  };

  const handleStartNewGame = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Force a hard refresh of the page
    window.location.href = "/";
  };

  return (
    <div className="text-white">
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
            <Image src="/loading.gif" alt="Loading" width={180} height={180} />
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
                      ? Number(bet.bet_amount).toFixed(2)
                      : bet.winner_address === wallet.publicKey?.toBase58()
                      ? (Number(bet.bet_amount) * 2).toFixed(2)
                      : Number(bet.bet_amount).toFixed(2)
                    : Number(bet.bet_amount).toFixed(2)}{" "}
                  SOL
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
                <BetOptions
                  betId={bet.id}
                  betAmount={bet.bet_amount}
                  potAddress={bet.pot_address}
                  onBetPlaced={handleBetPlaced}
                  isResolved={isResolved}
                />
                <p className="mt-4 text-center text-sm text-gray-400">
                  Choose your move and match the game amount. Whoever wins gets
                  the pot! <br />
                  Winnings are automatically sent to the winning wallet address.
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
              <a
                href="/"
                onClick={handleStartNewGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-block"
              >
                Start New Game
              </a>
            </div>
          )}

<div className="mt-6 text-center space-x-4">
  <button
    onClick={shareOnTwitter}
    className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded inline-flex items-center"
  >
    <FaTwitter className="mr-2" />
    Share on X
  </button>
  {showShareButton ? (
    <button
      onClick={shareGame}
      className="bg-[#f13992] text-white hover:bg-white hover:text-[#f13992] font-bold py-2 px-4 rounded inline-flex items-center transition-colors duration-200"
    >
      <FaShare className="mr-2" />
      Share Game
    </button>
  ) : (
    <span className="text-green-400">{copyMessage}</span>
  )}
</div>
        </>
      )}
    </div>
  );
}

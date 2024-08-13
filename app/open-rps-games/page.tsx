"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Navbar from "../components/Navbar";
import { getOpenRPSBets } from "../server/sol/getOpenRPSBets";
import RPSBetCard from "../components/RPSBetCard";
import { Press_Start_2P } from "next/font/google";
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

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
  const wallet = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    fetchOpenBets();
  }, []);

  async function fetchOpenBets() {
    setIsLoading(true);
    const result = await getOpenRPSBets();
    if (result.success) {
      setOpenBets(result.bets ?? []);
    } else {
      setError(result.error || "Failed to fetch open bets");
    }
    setIsLoading(false);
  }

  const handleBetTaken = (betId: number) => {
    setOpenBets((prevBets) => prevBets.filter((bet) => bet.id !== betId));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          Open Games
        </h1>
        {isLoading && <p className="text-center">Loading Live Games...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {openBets.map((bet) => (
            <Link href={`/rps-game/${bet.id}`} key={bet.id}>
              <RPSBetCard bet={bet} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

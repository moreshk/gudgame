"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import { getLastResolvedBets } from "../../server/getBetsByAddress";
import { Press_Start_2P } from "next/font/google";
import Link from 'next/link';

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

interface RPSBet {
  id: number;
  bet_maker_address: string;
  maker_bet: string;
  bet_taker_address: string | null;
  taker_bet: string | null;
  bet_amount: number;
  winner_address: string;
  is_maker: boolean;
}

export default function BetsByAddress() {
  const [bets, setBets] = useState<RPSBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const address = params.address as string;

  useEffect(() => {
    if (address) {
      fetchBets(address);
    }
  }, [address]);

  async function fetchBets(address: string) {
    setIsLoading(true);
    const result = await getLastResolvedBets(address);
    if (result.success) {
      setBets(result.bets ?? []);
    } else {
      setError(result.error || "Failed to fetch bets");
    }
    setIsLoading(false);
  }

  const getBetImage = (bet: string) => {
    switch (bet.toLowerCase()) {
      case 'rock':
        return '/rock.png';
      case 'paper':
        return '/paper.png';
      case 'scissors':
        return '/scissors.png';
      default:
        return '/unknown.png'; // You might want to add a default image
    }
  };

  const shortenAddress = (address: string) => 
    `${address.slice(0, 4)}...${address.slice(-4)}`;


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
      <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          <Link href={`https://solscan.io/account/${address}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {shortenAddress(address)}
          </Link> bets
        </h1>
        {isLoading && <p className="text-center">Loading bets...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {bets.length === 0 && !isLoading && (
          <p className="text-center">No recent bets found.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bets.map((bet) => (
            <div key={bet.id} className="bg-gray-800 p-4 rounded-lg shadow flex flex-col items-center">
               <Image 
                src={getBetImage(bet.is_maker ? bet.maker_bet : (bet.taker_bet ?? 'unknown'))}
                alt={bet.is_maker ? bet.maker_bet : (bet.taker_bet ?? 'unknown')}
                width={100}
                height={100}
              />
              <p className="mt-2 text-center">{bet.is_maker ? bet.maker_bet : bet.taker_bet}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
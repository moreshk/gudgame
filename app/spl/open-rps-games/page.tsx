"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Navbar from "../../components/Navbar";
import { getOpenRPSBets } from "../../server/spl/getOpenRPSSplBets";
import { getTokenInfo } from "../../server/spl/getTokenInfo";
import RPSSplBetCard from "../../components/spl/RPSSplBetCard";
import { Press_Start_2P } from "next/font/google";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

interface OpenRPSSplBet {
    id: number;
    bet_maker_address: string;
    bet_amount: number;
    pot_address: string;
    bet_making_timestamp: Date;
    token_contract_address: string;
    token_decimals: number;
  }

interface TokenInfo {
  token_symbol: string;
  token_decimals: number;
}

export default function OpenRPSSplBets() {
  const [openBets, setOpenBets] = useState<OpenRPSSplBet[]>([]);
  const [tokenInfoMap, setTokenInfoMap] = useState<Record<string, TokenInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  const { connection } = useConnection();


  const fetchOpenBets = useCallback(async () => {
    setIsLoading(true);
    const result = await getOpenRPSBets();
    if (result.success) {
      setOpenBets(result.bets as OpenRPSSplBet[]);
      await fetchTokenInfo(result.bets as OpenRPSSplBet[]);
    } else {
      setError(result.error || "Failed to fetch open bets");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOpenBets();
  }, [fetchOpenBets]);

  async function fetchTokenInfo(bets: OpenRPSSplBet[]) {
    const uniqueTokenAddresses = Array.from(new Set(bets.map(bet => bet.token_contract_address)));
    const tokenInfoPromises = uniqueTokenAddresses.map(async (address) => {
      const result = await getTokenInfo(address);
      return { address, info: result.success ? result.tokenInfo : null };
    });

    const tokenInfoResults = await Promise.all(tokenInfoPromises);
    const newTokenInfoMap: Record<string, TokenInfo> = {};
    tokenInfoResults.forEach(({ address, info }) => {
      if (info) {
        newTokenInfoMap[address] = info;
      }
    });
    setTokenInfoMap(newTokenInfoMap);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          Open SPL Games
        </h1>
        {isLoading && <p className="text-center">Loading Live SPL Games...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {openBets.map((bet) => (
            <Link href={`/rps-spl-game/${bet.id}`} key={bet.id}>
              <RPSSplBetCard
                bet={bet}
                tokenInfo={tokenInfoMap[bet.token_contract_address]}
              />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { fetchLeaderboard } from "../server/fetchLeaderboard";
import Navbar from "../components/Navbar";
import { Press_Start_2P } from 'next/font/google';
const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

interface LeaderboardEntry {
  wallet_address: string;
  wins: number;
  losses: number;
  draws: number;
  earnings: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const result = await fetchLeaderboard();
        if (result.success && result.leaderboard) {
          setLeaderboard(result.leaderboard);
        } else {
          setError(result.error || "Failed to fetch leaderboard");
        }
      } catch (err) {
        setError("An error occurred while fetching the leaderboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  const formatAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1
          className={`text-2xl font-bold mb-4 text-center text-[#f13992] ${pressStart2P.className}`}
        >
          Leaderboard
        </h1>
        {isLoading && <p className="text-center">Loading leaderboard...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-4 py-2">Wallet Address</th>
                  <th className="px-4 py-2">Wins</th>
                  <th className="px-4 py-2">Losses</th>
                  <th className="px-4 py-2">Draws</th>
                  <th className="px-4 py-2">Earnings (SOL)</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-700" : "bg-gray-600"}>
                    <td className="px-4 py-2">
                      <a
                        href={`https://solscan.io/account/${entry.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {formatAddress(entry.wallet_address)}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-center">{entry.wins}</td>
                    <td className="px-4 py-2 text-center">{entry.losses}</td>
                    <td className="px-4 py-2 text-center">{entry.draws}</td>
                    <td className="px-4 py-2 text-right">{entry.earnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchLeaderboard } from "../server/fetchLeaderboard";
import Navbar from "../components/Navbar";
import { Press_Start_2P } from 'next/font/google';
import { Switch } from '@headlessui/react';
import Papa from 'papaparse';

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
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<Set<string>>(new Set());
  const [showOnlyWhitelisted, setShowOnlyWhitelisted] = useState(false);

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

  const loadWhitelist = useCallback(async () => {
    try {
      const response = await fetch('/whitelist.csv');
      const csvText = await response.text();
      Papa.parse<string[]>(csvText, {
        complete: (results: Papa.ParseResult<string[]>) => {
          const addresses = new Set(results.data.flat().filter(Boolean));
          setWhitelistedAddresses(addresses);
        },
        error: (error: Error, file?: Papa.LocalFile) => {
          console.error('Error parsing CSV:', error);
          setError("Failed to load whitelist");
        }
      });
    } catch (error) {
      console.error('Error loading whitelist:', error);
      setError("Failed to load whitelist");
    }
  }, []);

  useEffect(() => {
    loadWhitelist();
  }, [loadWhitelist]);

  const formatAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  const filteredLeaderboard = showOnlyWhitelisted
    ? leaderboard.filter(entry => whitelistedAddresses.has(entry.wallet_address))
    : leaderboard;

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
          <>
            <div className="flex items-center justify-end mb-4">
              <span className="mr-2">Show only whitelisted addresses</span>
              <Switch
                checked={showOnlyWhitelisted}
                onChange={setShowOnlyWhitelisted}
                className={`${
                  showOnlyWhitelisted ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    showOnlyWhitelisted ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
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
                  {filteredLeaderboard.map((entry, index) => (
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
          </>
        )}
      </main>
    </div>
  );
}
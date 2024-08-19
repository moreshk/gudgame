'use client'

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { upgradeEarnRate } from '../server/upgradeEarnRate';
import Navbar from '../components/Navbar';

export default function UpgradePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [earnRate, setEarnRate] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const { publicKey } = useWallet();

  useEffect(() => {
    async function fetchUserData() {
      if (publicKey) {
        try {
          const response = await fetch(`/api/balance?wallet=${publicKey.toString()}`);
          const data = await response.json();
          setBalance(data.balance);
          setEarnRate(data.earnRate);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setMessage('Error fetching user data');
        }
      }
    }

    fetchUserData();
  }, [publicKey]);

  const handleUpgrade = async () => {
    if (publicKey) {
      setIsUpgrading(true);
      try {
        const result = await upgradeEarnRate(publicKey.toString());
        setBalance(result.balance);
        setEarnRate(result.earn_rate);
        setMessage('Upgrade successful!');
        setCooldown(true);
        setTimeout(() => {
          setCooldown(false);
          setMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Error upgrading earn rate:', error);
        setMessage(error instanceof Error ? error.message : 'Error upgrading earn rate');
      } finally {
        setIsUpgrading(false);
      }
    }
  };

  const calculateUpgradeCost = (currentEarnRate: number) => {
    return 300 * Math.pow(2, currentEarnRate - 1);
  };

  const getButtonText = () => {
    if (balance === null || earnRate === null) return 'Loading...';
    if (isUpgrading) return 'Upgrading...';
    if (cooldown) return 'Upgrade Successful!';
    if (balance < calculateUpgradeCost(earnRate)) return 'Insufficient Balance';
    return 'Upgrade Earn Rate';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Upgrade Earn Rate</h1>
        {publicKey ? (
          <>
            <p className="mb-2">Current Balance: {balance}</p>
            <p className="mb-4">Current Earn Rate: {earnRate}</p>
            {earnRate !== null && (
              <p className="mb-4">
                Cost for next upgrade: {calculateUpgradeCost(earnRate)}
              </p>
            )}
            <button
              onClick={handleUpgrade}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={isUpgrading || cooldown || balance === null || earnRate === null || balance < calculateUpgradeCost(earnRate)}
            >
              {getButtonText()}
            </button>
            {message && <p className="mt-4 text-sm">{message}</p>}
          </>
        ) : (
          <p>Please connect your wallet to upgrade your earn rate</p>
        )}
      </main>
    </div>
  );
}
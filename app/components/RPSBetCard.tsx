'use client';

import { PublicKey } from '@solana/web3.js';

interface RPSBetCardProps {
  bet: {
    id: number;
    bet_maker_address: string;
    bet_amount: number;
    pot_address: string;
  };
}

export default function RPSBetCard({ bet }: RPSBetCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
      <p className="text-lg font-semibold mb-2">Game Amount: {bet.bet_amount} SOL</p>
      <p className="text-sm text-gray-400 mb-4">
        Maker: {bet.bet_maker_address.slice(0, 4)}...{bet.bet_maker_address.slice(-4)}
      </p>
      <p className="text-sm text-gray-400">
        Pot: {new PublicKey(bet.pot_address).toBase58().slice(0, 4)}...{new PublicKey(bet.pot_address).toBase58().slice(-4)}
      </p>
    </div>
  );
}
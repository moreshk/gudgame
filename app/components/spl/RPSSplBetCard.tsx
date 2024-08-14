'use client';
import { PublicKey } from '@solana/web3.js';
import { getTokenInfo } from '../../server/spl/getTokenInfo';
// import { TokenInfo } from '../../tokenData';

interface TokenInfo {
    token_symbol: string;
    token_decimals: number;
  }

interface RPSSplBetCardProps {
  bet: {
    id: number;
    bet_maker_address: string;
    bet_amount: number;
    pot_address: string;
  };
  tokenInfo: TokenInfo;
}

export default function RPSSplBetCard({ bet, tokenInfo }: RPSSplBetCardProps) {
    const formattedAmount = tokenInfo
      ? (bet.bet_amount / Math.pow(10, tokenInfo.token_decimals)).toFixed(2)
      : bet.bet_amount.toString();
  
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors">
        <p className="text-lg font-semibold mb-2">Game Amount: {formattedAmount} {tokenInfo?.token_symbol || 'Unknown'}</p>
        <p className="text-sm text-gray-400 mb-4">
          Maker: <a href={`https://solscan.io/account/${bet.bet_maker_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {bet.bet_maker_address.slice(0, 4)}...{bet.bet_maker_address.slice(-4)}
          </a>
        </p>
        <p className="text-sm text-gray-400">
          Pot: <a href={`https://solscan.io/account/${bet.pot_address}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {new PublicKey(bet.pot_address).toBase58().slice(0, 4)}...{new PublicKey(bet.pot_address).toBase58().slice(-4)}
          </a>
        </p>
      </div>
    );
  }
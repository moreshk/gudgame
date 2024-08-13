'use client';

import { useState } from 'react';
import { getTokenInfo } from '../server/sol/getTokenInfo';
import Navbar from '../components/Navbar';

export default function TokenInfoPage() {
  const [contractAddress, setContractAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<null | { token_symbol: string; token_decimals: number } | undefined>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFetchTokenInfo = async () => {
    setIsLoading(true);
    setError('');
    setTokenInfo(null);

    try {
      const result = await getTokenInfo(contractAddress);
      if (result.success) {
        setTokenInfo(result.tokenInfo);
      } else {
        setError(result.error || 'Failed to fetch token info');
      }
    } catch (err) {
      setError('An error occurred while fetching token info');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Token Info</h1>
          <div className="space-y-4">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter token contract address"
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFetchTokenInfo}
              disabled={isLoading || !contractAddress}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              {isLoading ? 'Fetching...' : 'Get Token Info'}
            </button>
            {tokenInfo && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h2 className="font-bold text-green-800 mb-2">Token Information:</h2>
                <p className="text-green-700">Symbol: {tokenInfo.token_symbol}</p>
                <p className="text-green-700">Decimals: {tokenInfo.token_decimals}</p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
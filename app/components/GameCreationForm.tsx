import React, { useState } from 'react';

interface GameCreationFormProps {
  onSubmit: (maxPossibilities: number, initialThreshold: number, maxRounds: number) => void;
  isCreating: boolean;
}

export default function GameCreationForm({ onSubmit, isCreating }: GameCreationFormProps) {
  const [maxPossibilities, setMaxPossibilities] = useState(100);
  const [initialThreshold, setInitialThreshold] = useState(50);
  const [maxRounds, setMaxRounds] = useState(10);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialThreshold <= maxPossibilities) {
      setError('');
      onSubmit(maxPossibilities, initialThreshold, maxRounds);
    } else {
      setError('Initial threshold cannot be greater than max possibilities.');
    }
  };


  const handleMaxPossibilitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMaxPossibilities(value);
    if (initialThreshold > value) {
      setError('Initial threshold cannot be greater than max possibilities.');
    } else {
      setError('');
    }
  };

  const handleInitialThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setInitialThreshold(value);
    if (value > maxPossibilities) {
      setError('Initial threshold cannot be greater than max possibilities.');
    } else {
      setError('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showAdvanced && (
        <>
          <div>
            <label htmlFor="maxPossibilities" className="block text-sm font-medium text-gray-700 mb-1">
              Max Possibilities:
            </label>
            <input
              type="number"
              id="maxPossibilities"
              value={maxPossibilities}
              onChange={handleMaxPossibilitiesChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
          <div>
            <label htmlFor="initialThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Threshold:
            </label>
            <input
              type="number"
              id="initialThreshold"
              value={initialThreshold}
              onChange={handleInitialThresholdChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
          <div>
            <label htmlFor="maxRounds" className="block text-sm font-medium text-gray-700 mb-1">
              Max Rounds:
            </label>
            <input
              type="number"
              id="maxRounds"
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
            />
          </div>
        </>
      )}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={isCreating || !!error}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating...' : 'Create Game'}
      </button>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-blue-500 hover:text-blue-600 text-sm font-medium"
      >
        {showAdvanced ? 'Hide Advanced Parameters' : 'Show Advanced Parameters'}
      </button>
    </form>
  );
}
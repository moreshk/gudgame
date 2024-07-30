import React, { useState } from 'react';

interface GameCreationFormProps {
  onSubmit: (maxPossibilities: number, initialThreshold: number, maxRounds: number) => void;
  isCreating: boolean;
}

export default function GameCreationForm({ onSubmit, isCreating }: GameCreationFormProps) {
  const [maxPossibilities, setMaxPossibilities] = useState(100);
  const [initialThreshold, setInitialThreshold] = useState(50);
  const [maxRounds, setMaxRounds] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(maxPossibilities, initialThreshold, maxRounds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="maxPossibilities" className="block text-sm font-medium text-gray-700 mb-1">
          Max Possibilities:
        </label>
        <input
          type="number"
          id="maxPossibilities"
          value={maxPossibilities}
          onChange={(e) => setMaxPossibilities(Number(e.target.value))}
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
          onChange={(e) => setInitialThreshold(Number(e.target.value))}
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
      <button
        type="submit"
        disabled={isCreating}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out"
      >
        {isCreating ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passcode === 'superteam' || passcode === 'rps4life') {
      // Set a cookie to remember the user is authenticated
      document.cookie = 'isAuthenticated=true; path=/; max-age=3600'; // Expires in 1 hour
      
      // Add a small delay before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push('/');
    } else {
      setError('Incorrect passcode');
    }
  };

  useEffect(() => {
    // Check if the user is already authenticated
    const isAuthenticated = document.cookie.includes('isAuthenticated=true');
    if (isAuthenticated) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-100">Login to Access Beta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasscode(e.target.value)}
            placeholder="Enter passcode"
            className="w-full px-3 py-2 text-gray-100 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Submit
          </button>
          <p className="text-sm text-center text-gray-400">Reach out to @unreadyplayer on TG for access</p>
          {error && <p className="text-sm text-center text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
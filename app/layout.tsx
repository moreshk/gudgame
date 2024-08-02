import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Press_Start_2P } from 'next/font/google';

const pressStart2P = Press_Start_2P({ 
  weight: '400',
  subsets: ['latin'],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gud Game - Rock Paper Scissors on Solana',
  description: 'Play Rock Paper Scissors on the Solana blockchain and win SOL!',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      {/* <body className={`${inter.className} bg-gray-900 light:bg-white text-white light:text-gray-900 min-h-screen`}> */}
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
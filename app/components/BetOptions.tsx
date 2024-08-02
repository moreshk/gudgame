"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import { updateRPSBet } from "../server/updateRPSBets";
import Image from "next/image";
import { getRPSBetById } from "../server/getRPSBetById";

interface BetOptionsProps {
  betId: number;
  betAmount: number;
  potAddress: string;
  onBetPlaced: () => void;
  isResolved: boolean;
}

export default function BetOptions({
  betId,
  betAmount,
  potAddress,
  onBetPlaced,
  isResolved,
}: BetOptionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<
    "Rock" | "Paper" | "Scissors" | null
  >(null);
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_ENDPOINT as string
  );

  const confirmTransaction = async (
    signature: string,
    maxRetries = 10,
    interval = 5000,
    timeout = 120000
  ) => {
    const startTime = Date.now();
    for (let i = 0; i < maxRetries; i++) {
      if (Date.now() - startTime > timeout) {
        throw new Error("Transaction confirmation timeout");
      }
      const confirmation = await connection.getSignatureStatus(signature);
      if (
        confirmation.value?.confirmationStatus === "confirmed" ||
        confirmation.value?.confirmationStatus === "finalized"
      ) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error("Transaction confirmation timeout");
  };

  const placeBet = async (choice: "Rock" | "Paper" | "Scissors") => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setIsProcessing(true);
    setSelectedChoice(choice);
    setError(null);
    try {

      const potPublicKey = new PublicKey(potAddress);
      const housePublicKey = new PublicKey(
        process.env.NEXT_PUBLIC_HOUSE_ADDRESS as string
      );

      const totalLamports = betAmount * 1e9;
      const potLamports = Math.floor(totalLamports * 0.9);
      const houseLamports = totalLamports - potLamports;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: potPublicKey,
          lamports: potLamports,
        }),
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: housePublicKey,
          lamports: houseLamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      
      // Set isProcessing to false after user signs the transaction
      setIsProcessing(false);
      setIsConfirming(true);

      const txId = await sendAndConfirmRawTransaction(
        connection,
        signedTx.serialize(),
        {
          skipPreflight: true,
          commitment: "confirmed",
          maxRetries: 5,
        }
      );

      await confirmTransaction(txId, 10, 5000, 120000);

      const updateResult = await updateRPSBet({
        id: betId,
        betTakerAddress: wallet.publicKey.toBase58(),
        takerSignature: txId,
        takerBet: choice,
      });

      if (updateResult.success) {
        onBetPlaced();
      } else {
        console.error("Failed to update bet:", updateResult.error);
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsProcessing(false);
      setIsConfirming(false);
      setSelectedChoice(null);
    }
  };

  const handleIconClick = async (choice: "Rock" | "Paper" | "Scissors") => {
    if (!wallet.connected) {
      setVisible(true);
      return;
    }

    setIsCheckingStatus(true);
    setError(null);

    try {
      // Check bet status before proceeding
      const result = await getRPSBetById(betId);
      if (result.success && result.bet) {
        if (result.bet.bet_taker_address && result.bet.taker_bet) {
          setError("This bet has already been taken. Please refresh the page.");
          return;
        }
      } else {
        throw new Error("Failed to fetch bet status");
      }

      // If we get here, the bet is still available
      await placeBet(choice);
    } catch (error) {
      console.error("Error checking bet status:", error);
      setError(error instanceof Error ? error.message : "An error occurred while checking bet status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getButtonClass = (choice: "Rock" | "Paper" | "Scissors") => {
    let baseClass = "transition-opacity border border-gray-400 rounded-md p-2 ";
    if ((isProcessing || isConfirming) && selectedChoice === choice) {
      return baseClass + "opacity-100";
    } else if (isProcessing || isConfirming) {
      return baseClass + "opacity-50 cursor-not-allowed";
    } else {
      return baseClass + "opacity-70 hover:opacity-100 cursor-pointer";
    }
  };

  if (isResolved) {
    return null;
  }

  return (
    <div className="flex flex-col items-center mt-8">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <h3 className="text-lg font-semibold mb-4">Choose your move and see if you win!</h3>
      <div className="flex justify-center space-x-8 mb-4">
        <button
          onClick={() => handleIconClick("Rock")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Rock")}
        >
          <Image src="/rock.png" alt="Rock" width={60} height={60} />
        </button>
        <button
          onClick={() => handleIconClick("Paper")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Paper")}
        >
          <Image src="/paper.png" alt="Paper" width={60} height={60} />
        </button>
        <button
          onClick={() => handleIconClick("Scissors")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Scissors")}
        >
          <Image src="/scissors.png" alt="Scissors" width={60} height={60} />
        </button>
      </div>
      {isCheckingStatus && (
        <p className="text-yellow-400">Checking bet status...</p>
      )}
      {isProcessing && (
        <p className="text-yellow-400">
          Processing bet, please confirm the transaction in your wallet...
        </p>
      )}
      {isConfirming && (
        <p className="text-yellow-400">
          Transaction signed. Waiting for confirmation on the blockchain...
        </p>
      )}
      {!wallet.connected && (
        <p className="text-sm text-gray-400 mt-2">
          Click an icon to connect your wallet and place a bet
        </p>
      )}
    </div>
  );
}
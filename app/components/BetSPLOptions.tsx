"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { updateRPSBet } from "../server/updateRPSBets";
import Image from "next/image";
import { getRPSSplBetById } from "../server/spl/getRPSSplBetById";
import { getTokenInfo } from "../server/getTokenInfo";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

interface BetSPLOptionsProps {
  betId: number;
  betAmount: number;
  potAddress: string;
  onBetPlaced: () => void;
  isResolved: boolean;
  tokenContractAddress: string;
}

export default function BetSPLOptions({
  betId,
  betAmount,
  potAddress,
  onBetPlaced,
  isResolved,
  tokenContractAddress,
}: BetSPLOptionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<
    "Rock" | "Paper" | "Scissors" | null
  >(null);
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();

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
      const tokenInfo = await getTokenInfo(tokenContractAddress);
    if (!tokenInfo.success || !tokenInfo.tokenInfo) {
      throw new Error("Failed to fetch token info");
    }

    const tokenDecimals = tokenInfo.tokenInfo.token_decimals;
    const totalAmount = BigInt(betAmount);
    const potAmount = totalAmount * BigInt(90) / BigInt(100);
    const houseAmount = totalAmount - potAmount;
    
    console.log(`Total amount: ${totalAmount.toString()}, Pot amount: ${potAmount.toString()}, House amount: ${houseAmount.toString()}`);

  
      const tokenMint = new PublicKey(tokenContractAddress);
      const potPublicKey = new PublicKey(potAddress);
      const housePublicKey = new PublicKey(
        process.env.NEXT_PUBLIC_HOUSE_ADDRESS as string
      );
  
      if (!tokenInfo.tokenInfo) {
        throw new Error("Token info is missing");
      }
  
      const fromTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
      const toPotTokenAccount = await getAssociatedTokenAddress(tokenMint, potPublicKey);
      const toHouseTokenAccount = await getAssociatedTokenAddress(tokenMint, housePublicKey);
  
      const transaction = new Transaction();
  
      // Check if the recipient's ATAs exist, if not, add instructions to create them
      const toPotTokenAccountInfo = await connection.getAccountInfo(toPotTokenAccount);
      if (!toPotTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            toPotTokenAccount,
            potPublicKey,
            tokenMint
          )
        );
      }
  
      const toHouseTokenAccountInfo = await connection.getAccountInfo(toHouseTokenAccount);
      if (!toHouseTokenAccountInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            toHouseTokenAccount,
            housePublicKey,
            tokenMint
          )
        );
      }
  
      // Add transfer instructions
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toPotTokenAccount,
          wallet.publicKey,
          potAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
  
      transaction.add(
        createTransferInstruction(
          fromTokenAccount,
          toHouseTokenAccount,
          wallet.publicKey,
          houseAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );
  
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
  
      // Simulate the transaction to get the required SOL
      const simulationResult = await connection.simulateTransaction(transaction);
      const requiredSOL = simulationResult.value.accounts?.find(
        (account) => account?.owner === wallet.publicKey?.toBase58()
      )?.lamports || 0;
  
      // Check if the wallet has enough SOL
      const walletBalance = await connection.getBalance(wallet.publicKey);
      if (walletBalance < requiredSOL) {
        throw new Error(`Not enough SOL. Required: ${requiredSOL / LAMPORTS_PER_SOL} SOL, Available: ${walletBalance / LAMPORTS_PER_SOL} SOL`);
      }
  
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
      const result = await getRPSSplBetById(betId);
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
      console.error("Error checking game status:", error);
      setError(error instanceof Error ? error.message : "An error occurred while checking game status");
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
      <h1 className="text-lg font-semibold mb-4 text-center sm:text-left">Choose your move and see if you win!</h1>
      <div className="flex justify-center space-x-8 mb-4">
        <button
          onClick={() => handleIconClick("Rock")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Rock")}
        >
          <Image src="/rock.png" alt="Rock" width={90} height={90} />
        </button>
        <button
          onClick={() => handleIconClick("Paper")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Paper")}
        >
          <Image src="/paper.png" alt="Paper" width={90} height={90} />
        </button>
        <button
          onClick={() => handleIconClick("Scissors")}
          disabled={isProcessing || isConfirming || isCheckingStatus}
          className={getButtonClass("Scissors")}
        >
          <Image src="/scissors.png" alt="Scissors" width={90} height={90} />
        </button>
      </div>
      {isCheckingStatus && (
        <p className="text-yellow-400">Checking game status...</p>
      )}
      {isProcessing && (
        <p className="text-yellow-400">
          Processing game, please confirm the transaction in your wallet...
        </p>
      )}
      {isConfirming && (
        <>
        <p className="text-yellow-400">
          Transaction signed. Waiting for confirmation on the blockchain...
        </p>
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <Image src="/loading.gif" alt="Loading" width={100} height={100} />
      </div>
      </>
      )}
      {!wallet.connected && (
        <p className="text-sm text-gray-400 mt-2">
          Click an icon to connect your wallet and place a bet
        </p>
      )}
    </div>
  );
}
'use server';

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// Import the endpoint from the providers file
const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

interface TransferSolInput {
  publicKey: string;
  privateKey: string;
  destinationAddress1: string;
  destinationAddress2: string;
  option: 1 | 2 | 3;
}

export async function transferSol(input: TransferSolInput) {
  try {
    const { publicKey, privateKey, destinationAddress1, destinationAddress2, option } = input;

    // Use the endpoint from providers
    const connection = new Connection(endpoint, 'confirmed');

    // Create a Keypair from the private key
    const secretKey = bs58.decode(privateKey);
    const fromKeypair = Keypair.fromSecretKey(secretKey);

    // Get the balance of the source account
    const balance = await connection.getBalance(fromKeypair.publicKey);

    // Estimate the transaction fee (assuming a simple transfer)
    const { feeCalculator } = await connection.getRecentBlockhash();
    const estimatedFee = feeCalculator.lamportsPerSignature * 1; // Multiply by number of signatures if more are needed

    // Calculate the amount to transfer (subtracting the estimated fee)
    const transferAmount = balance - estimatedFee;

    if (transferAmount <= 0) {
      throw new Error('Insufficient balance to cover transfer and fees');
    }

    let transaction = new Transaction();

    switch (option) {
      case 1:
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(destinationAddress1),
            lamports: transferAmount,
          })
        );
        break;
      case 2:
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(destinationAddress2),
            lamports: transferAmount,
          })
        );
        break;
      case 3:
        const halfAmount = Math.floor(transferAmount / 2);
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(destinationAddress1),
            lamports: halfAmount,
          })
        );
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(destinationAddress2),
            lamports: transferAmount - halfAmount, // Remaining balance (accounting for odd numbers)
          })
        );
        break;
      default:
        throw new Error('Invalid option. Must be 1, 2, or 3.');
    }

    // Sign and send the transaction
    const signature = await connection.sendTransaction(transaction, [fromKeypair]);

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    return {
      success: true,
      signature,
      message: `Transfer completed. Signature: ${signature}`,
    };
  } catch (error) {
    console.error('Error transferring SOL:', error);
    return { success: false, error: 'Failed to transfer SOL' };
  }
}
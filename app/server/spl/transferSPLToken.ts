import {
    Connection,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    Keypair,
  } from '@solana/web3.js';
  
  import {
    TOKEN_PROGRAM_ID,
    createTransferInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
  } from '@solana/spl-token';
  
  import bs58 from 'bs58';
  
  interface TransferSPLTokenParams {
    connection: Connection;
    publicKey: string;
    privateKey: string | Buffer | number[];
    destinationAddress1: string;
    destinationAddress2: string;
    option: 1 | 2 | 3;
    tokenMint: PublicKey;
    amount: bigint;
    decimals: number;
  }
  
  export async function transferSPLToken({
    connection,
    publicKey,
    privateKey,
    destinationAddress1,
    destinationAddress2,
    option,
    tokenMint,
    amount,
    decimals,
  }: TransferSPLTokenParams): Promise<{ success: boolean; error?: string; signature?: string }> {
    try {
      console.log("Received private key:", typeof privateKey === 'string' ? privateKey.substring(0, 10) + '...' : 'Non-string type');
      console.log("Private key type:", typeof privateKey);
      console.log("Private key length:", typeof privateKey === 'string' ? privateKey.length : (privateKey as any).length);
  
      const fromPubkey = new PublicKey(publicKey);
      
      let fromKeypair: Keypair;
      if (typeof privateKey === 'string') {
        // If it's a string, try base58 decoding first, then hex
        try {
          fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        } catch (e) {
          fromKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        }
      } else if (Buffer.isBuffer(privateKey)) {
        // If it's a Buffer, use it directly
        fromKeypair = Keypair.fromSecretKey(privateKey);
      } else if (Array.isArray(privateKey)) {
        // If it's an array, convert to Uint8Array
        fromKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKey));
      } else {
        throw new Error("Unsupported private key format");
      }
  
      console.log("Keypair created successfully");
      
      const dest1Pubkey = new PublicKey(destinationAddress1);
      const dest2Pubkey = new PublicKey(destinationAddress2);
  
      const fromATA = await getAssociatedTokenAddress(tokenMint, fromPubkey);
      const toATA1 = await getAssociatedTokenAddress(tokenMint, dest1Pubkey);
      const toATA2 = await getAssociatedTokenAddress(tokenMint, dest2Pubkey);
  
      const transaction = new Transaction();
  
      // Check if destination ATAs exist and create them if necessary
      const toATA1Info = await connection.getAccountInfo(toATA1);
      if (!toATA1Info) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            toATA1,
            dest1Pubkey,
            tokenMint
          )
        );
      }
  
      const toATA2Info = await connection.getAccountInfo(toATA2);
      if (!toATA2Info) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            toATA2,
            dest2Pubkey,
            tokenMint
          )
        );
      }
  
      // Calculate transfer amounts based on the option
      let amount1 = BigInt(0);
      let amount2 = BigInt(0);
      switch (option) {
        case 1:
          amount1 = amount;
          break;
        case 2:
          amount2 = amount;
          break;
        case 3:
          amount1 = amount / BigInt(2);
          amount2 = amount - amount1; // Handle odd amounts
          break;
      }
  
      // Add transfer instructions
      if (amount1 > 0) {
        transaction.add(
          createTransferInstruction(
            fromATA,
            toATA1,
            fromPubkey,
            amount1,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
      if (amount2 > 0) {
        transaction.add(
          createTransferInstruction(
            fromATA,
            toATA2,
            fromPubkey,
            amount2,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
  
      console.log("Transaction built, sending...");
      const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
      console.log("Transaction sent successfully, signature:", signature);
  
      return { success: true, signature };
    } catch (error) {
      console.error('Error in transferSPLToken:', error);
      return { success: false, error: (error as Error).message };
    }
  }
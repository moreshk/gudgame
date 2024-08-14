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
    getAccount
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
    decimals: number;
  }
  
  async function getConfirmedBalance(connection: Connection, address: PublicKey, maxRetries = 5): Promise<bigint> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const tokenAccount = await getAccount(connection, address, 'confirmed');
        const balance = tokenAccount.amount;
        console.log(`Attempt ${i + 1}: Confirmed token balance in source account: ${balance.toString()}`);
        return balance;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Attempt ${i + 1} failed: ${errorMessage}`);
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
    throw new Error(`Failed to get confirmed balance after ${maxRetries} retries`);
  }
  
  export async function transferSPLToken({
    connection,
    publicKey,
    privateKey,
    destinationAddress1,
    destinationAddress2,
    option,
    tokenMint,
    decimals,
  }: TransferSPLTokenParams): Promise<{ success: boolean; error?: string; signature?: string }> {
    try {
      console.log("Received private key:", typeof privateKey === 'string' ? privateKey.substring(0, 10) + '...' : 'Non-string type');
      console.log("Private key type:", typeof privateKey);
      console.log("Private key length:", typeof privateKey === 'string' ? privateKey.length : (privateKey as any).length);
  
      const fromPubkey = new PublicKey(publicKey);
      
      let fromKeypair: Keypair;
      if (typeof privateKey === 'string') {
        try {
          fromKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
        } catch (e) {
          fromKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        }
      } else if (Buffer.isBuffer(privateKey)) {
        fromKeypair = Keypair.fromSecretKey(privateKey);
      } else if (Array.isArray(privateKey)) {
        fromKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKey));
      } else {
        throw new Error("Unsupported private key format");
      }
  
      console.log("Keypair created successfully");
      
      const dest1Pubkey = new PublicKey(destinationAddress1);
      const dest2Pubkey = new PublicKey(destinationAddress2);
  
      const fromATA = await getAssociatedTokenAddress(tokenMint, fromPubkey);
      
      // Get confirmed token balance
      const tokenBalance = await getConfirmedBalance(connection, fromATA);
      console.log(`Total confirmed balance to transfer: ${tokenBalance.toString()}`);
  
      if (tokenBalance === BigInt(0)) {
        throw new Error(`No tokens available to transfer.`);
      }
  
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
          amount1 = tokenBalance;
          break;
        case 2:
          amount2 = tokenBalance;
          break;
        case 3:
          amount1 = tokenBalance / BigInt(2);
          amount2 = tokenBalance - amount1; // Handle odd amounts
          break;
      }
      
      console.log(`Amount to transfer to destination 1: ${amount1.toString()}`);
      console.log(`Amount to transfer to destination 2: ${amount2.toString()}`);
      
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
      const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair], {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      });
      console.log("Transaction sent successfully, signature:", signature);
  
      return { success: true, signature };
    } catch (error) {
      console.error('Error in transferSPLToken:', error);
      return { success: false, error: (error as Error).message };
    }
  }
"use server";

import { sql } from "@vercel/postgres";
import { getRPSBetById } from "./getRPSBetById";
import { decryptPrivateKey } from "./decryptKey";
import { transferSol } from "./transferSol";
import { decryptBet } from "./decryptBet";

interface ResolveRPSBetResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function resolveRPSBet(id: number): Promise<ResolveRPSBetResult> {
  console.log(`Starting to resolve RPS bet with ID: ${id}`);
  try {
    // Get the bet details
    console.log("Fetching bet details...");
    const betResult = await getRPSBetById(id);
    if (!betResult.success || !betResult.bet) {
      console.error("Failed to fetch bet details:", betResult.error);
      throw new Error(betResult.error || "Failed to fetch bet details");
    }
    const bet = betResult.bet;
    console.log("Bet details:", JSON.stringify(bet, null, 2));

    // Ensure the bet is ready to be resolved
    if (!bet.bet_taker_address || !bet.taker_bet) {
      console.error("Bet is not ready to be resolved");
      throw new Error("Bet is not ready to be resolved");
    }

    // Get the encrypted private key for the pot address
    console.log("Fetching pot address details...");
    const potResult = await sql`
      SELECT encrypted_private_key
      FROM pot_addresses
      WHERE pot_address = ${bet.pot_address};
    `;
    if (potResult.rows.length === 0) {
      console.error("Pot address not found");
      throw new Error("Pot address not found");
    }
    console.log("Pot address details fetched successfully");

    // Decrypt the private key
    const encryptedPrivateKey = potResult.rows[0].encrypted_private_key;
    console.log("Encrypted private key:", encryptedPrivateKey);

    let privateKey;
    try {
      console.log("Attempting to decrypt private key...");
      // Convert Buffer to string if it's a Buffer
      const encryptedPrivateKeyString = Buffer.isBuffer(encryptedPrivateKey)
        ? encryptedPrivateKey.toString("utf8")
        : encryptedPrivateKey;
      privateKey = await decryptPrivateKey(encryptedPrivateKeyString);
      console.log("Private key decrypted successfully");
    } catch (decryptError) {
      console.error("Error decrypting private key:", decryptError);
      throw new Error(
        `Failed to decrypt private key: ${
          (decryptError as Error).message || "Unknown error"
        }`
      );
    }

    // Decrypt the maker's bet
    console.log("Decrypting maker's bet...");
    let decryptedMakerBet;
    try {
      decryptedMakerBet = await decryptBet(bet.maker_bet);
      console.log("Maker's bet decrypted successfully:", decryptedMakerBet);
    } catch (decryptError) {
      console.error("Error decrypting maker's bet:", decryptError);
      throw new Error(`Failed to decrypt maker's bet: ${(decryptError as Error).message || "Unknown error"}`);
    }

    // Determine the winner
    console.log("Determining the winner...");
    let option: 1 | 2 | 3;
    let winnerAddress: string;
    if (decryptedMakerBet === bet.taker_bet) {
      option = 3; // Draw
      winnerAddress = "DRAW";
    } else if (
      (decryptedMakerBet === "Rock" && bet.taker_bet === "Scissors") ||
      (decryptedMakerBet === "Paper" && bet.taker_bet === "Rock") ||
      (decryptedMakerBet === "Scissors" && bet.taker_bet === "Paper")
    ) {
      option = 1; // Maker wins
      winnerAddress = bet.bet_maker_address;
    } else {
      option = 2; // Taker wins
      winnerAddress = bet.bet_taker_address;
    }
    console.log(`Winner determined: ${winnerAddress}, Option: ${option}`);

    // Transfer SOL
    console.log("Initiating SOL transfer...");
    const transferResult = await transferSol({
      publicKey: bet.pot_address,
      privateKey,
      destinationAddress1: bet.bet_maker_address,
      destinationAddress2: bet.bet_taker_address,
      option,
    });

    if (!transferResult.success) {
      console.error("Failed to transfer SOL:", transferResult.error);
      throw new Error(transferResult.error || "Failed to transfer SOL");
    }
    console.log("SOL transfer successful");

    // Update the bet record
    console.log("Updating bet record...");
    await sql`
      UPDATE rock_paper_scissors_bets
      SET winner_address = ${winnerAddress},
          winnings_disbursement_signature = ${transferResult.signature}
      WHERE id = ${id};
    `;
    console.log("Bet record updated successfully");

    return {
      success: true,
      message: `Bet resolved successfully. Winner: ${
        winnerAddress === "DRAW" ? "Draw" : winnerAddress
      }`,
    };
  } catch (error) {
    console.error("Error resolving RPS bet:", error);
    return {
      success: false,
      error: `Failed to resolve RPS bet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

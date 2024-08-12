'use server';

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface TokenInfo {
  token_symbol: string;
  token_decimals: number;
}

export async function getTokenInfo(contractAddress: string) {
  try {
    const csvFilePath = path.join(process.cwd(), 'public', 'spl.csv');
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true });

    const tokenInfo = records.find((record: any) => record.token_contract_address === contractAddress);

    if (!tokenInfo) {
      return { success: false, error: 'Token not found' };
    }

    return {
      success: true,
      tokenInfo: {
        token_symbol: tokenInfo.token_symbol,
        token_decimals: parseInt(tokenInfo.token_decimals, 10)
      }
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return { success: false, error: 'Failed to fetch token info' };
  }
}
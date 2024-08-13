import { tokenData, TokenInfo } from '../tokenData';

export async function getTokenInfo(contractAddress: string) {
  try {
    const token = tokenData.find(t => t.token_contract_address === contractAddress);
    
    if (token) {
      return {
        success: true,
        tokenInfo: {
          token_symbol: token.token_symbol,
          token_decimals: token.token_decimals
        }
      };
    } else {
      return {
        success: false,
        error: "Token not found"
      };
    }
  } catch (error) {
    console.error("Error in getTokenInfo:", error);
    return {
      success: false,
      error: "An error occurred while fetching token info"
    };
  }
}
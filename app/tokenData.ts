export interface TokenInfo {
    token_name: string;
    token_symbol: string;
    token_contract_address: string;
    token_decimals: number;
  }
  
  export const tokenData: TokenInfo[] = [
    {
      token_name: "RETARDIO",
      token_symbol: "RETARDIO",
      token_contract_address: "Eyi4ZC14YyADn3P9tQ7oT5cmq6DCxBTt9ZLszdfX3mh2",
      token_decimals: 9
    }
    // Add more tokens here as needed
  ];
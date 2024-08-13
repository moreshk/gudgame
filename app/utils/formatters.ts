export const formatAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;
  
  export const formatDate = (date: Date) => new Date(date).toLocaleString();
  
  export const formatSignature = (signature: string) =>
    `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  
  export const formatTokenAmount = (amount: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.floor(amount / factor).toString();
  };
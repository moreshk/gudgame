interface BalanceDisplayProps {
    balance: number;
    earnRate: number;
  }
  
  export default function BalanceDisplay({ balance, earnRate }: BalanceDisplayProps) {
    return (
      <>
        <p className="text-xl mt-4">Your Balance: {balance}</p>
        <p className="text-lg mt-2">Earn Rate: {earnRate}</p>
      </>
    );
  }
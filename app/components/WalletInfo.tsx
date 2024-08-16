import { formatAddress } from '../utils/formatters';

interface WalletInfoProps {
  walletAddress: string;
  ch2Status: string | null;
}

export default function WalletInfo({ walletAddress, ch2Status }: WalletInfoProps) {
  return (
    <>
      <h2 className="text-2xl mb-4">Hello {formatAddress(walletAddress)}</h2>
      {ch2Status && (
        <p className={`text-lg ${ch2Status === 'You are on the CH2 list!' ? 'text-green-500' : 'text-red-500'}`}>
          {ch2Status}
        </p>
      )}
    </>
  );
}
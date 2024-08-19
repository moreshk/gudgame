import Navbar from '../components/Navbar';
import UpgradeEarnRate from '../components/UpgradeEarnRate';

export default function UpgradePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Upgrade Options</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UpgradeEarnRate />
          {/* Add more upgrade components here as needed */}
        </div>
      </main>
    </div>
  );
}
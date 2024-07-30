import { fetchGameById } from '../../server/fetchGameById';
import { fetchPlaysByGameId } from '../../server/fetchPlaysByGameId';

export default async function GameDetailsPage({ params }: { params: { id: string } }) {
  const { success: gameSuccess, game, error: gameError } = await fetchGameById(parseInt(params.id));
  const { success: playsSuccess, plays, error: playsError } = await fetchPlaysByGameId(parseInt(params.id));

  if (!gameSuccess) {
    return <div className="text-red-500">Error loading game: {gameError}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Game Details</h1>
      <div className="bg-gray-800 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-2 text-white">Game Information</h2>
        <p className="text-white">Max Possibilities: {game?.max_possibilities}</p>
        <p className="text-white">Initial Threshold: {game?.initial_threshold}</p>
        <p className="text-white">Max Rounds: {game?.max_rounds}</p>
        <p className="text-white">Created: {new Date(game?.timestamp).toLocaleString()}</p>
      </div>

      <h2 className="text-xl font-semibold mb-4 text-white">Plays</h2>
      {!playsSuccess ? (
        <div className="text-red-500">Error loading plays: {playsError}</div>
      ) : plays?.length === 0 ? (
        <p className="text-white">No plays for this game yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-2">Timestamp</th>
                <th className="px-4 py-2">Wallet Address</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">RNG</th>
                <th className="px-4 py-2">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {plays?.map((play) => (
                <tr key={play.id} className="border-b border-gray-600 hover:bg-gray-700">
                  <td className="px-4 py-2 text-white">{new Date(play.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 text-white">{play.wallet_address}</td>
                  <td className="px-4 py-2 text-white">{play.amount}</td>
                  <td className="px-4 py-2 text-white">{play.rng}</td>
                  <td className="px-4 py-2 text-white">{play.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
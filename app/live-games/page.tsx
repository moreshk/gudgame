import { fetchGames } from "../server/sol/fetchGames";

export default async function GamesPage() {
  const { success, games, error } = await fetchGames();

  if (!success) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  console.log(`Received ${games?.length} games in the component`);

  const sortedGames = games?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  console.log(`Sorted ${sortedGames?.length} games`);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4 text-white">Active Games ({sortedGames?.length})</h1>
       <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Creator Address</th>
            <th className="px-4 py-2 text-right">Max Possibilities</th>
            <th className="px-4 py-2 text-right">Initial Threshold</th>
            <th className="px-4 py-2 text-right">Max Rounds</th>
            <th className="px-4 py-2 text-right">Creation Time</th>
          </tr>
        </thead>
        <tbody>
          {sortedGames?.map((game) => (
            <tr key={game.id} className="border-b border-gray-700 hover:bg-gray-700">
              <td className="px-4 py-2 text-white">{game.id}</td>
              <td className="px-4 py-2 text-white">{game.creator_address}</td>
              <td className="px-4 py-2 text-white text-right">{game.max_possibilities}</td>
              <td className="px-4 py-2 text-white text-right">{game.initial_threshold}</td>
              <td className="px-4 py-2 text-white text-right">{game.max_rounds}</td>
              <td className="px-4 py-2 text-white text-right">
                {new Date(game.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
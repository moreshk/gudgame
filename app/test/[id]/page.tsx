import RPSBetDetails from '../../components/RPSBetDetails';
import Navbar from '../../components/Navbar';

export default function RPSBetPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <RPSBetDetails id={Number(params.id)} />
      </main>
    </div>
  );
}
import { Link } from 'react-router-dom'

export default function WelcomePage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="text-6xl mb-6">🏸</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Badminton Tournament</h1>
      <p className="text-gray-500 text-lg mb-10">
        Organise single-elimination and round-robin tournaments for your group.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/tournaments"
          className="bg-white border rounded-xl p-5 text-left shadow-sm hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🏆</div>
          <h2 className="font-semibold text-gray-800 mb-1">Tournaments</h2>
          <p className="text-sm text-gray-500">Create and manage brackets or round-robin group stages.</p>
        </Link>
        <Link
          to="/players"
          className="bg-white border rounded-xl p-5 text-left shadow-sm hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">👤</div>
          <h2 className="font-semibold text-gray-800 mb-1">Players</h2>
          <p className="text-sm text-gray-500">Keep a roster of players ready to enter any tournament.</p>
        </Link>
      </div>
    </div>
  )
}

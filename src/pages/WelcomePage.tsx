import { Link } from 'react-router-dom'

export default function WelcomePage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="text-6xl mb-6">🏸</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Badminton Tournament</h1>
      <p className="text-gray-500 text-lg mb-10">
        Organise single-elimination and round-robin tournaments for your group.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white border rounded-xl p-5 text-left shadow-sm">
          <div className="text-2xl mb-2">🏆</div>
          <h2 className="font-semibold text-gray-800 mb-1">Tournaments</h2>
          <p className="text-sm text-gray-500">Create and manage brackets or round-robin group stages.</p>
        </div>
        <div className="bg-white border rounded-xl p-5 text-left shadow-sm">
          <div className="text-2xl mb-2">👤</div>
          <h2 className="font-semibold text-gray-800 mb-1">Players</h2>
          <p className="text-sm text-gray-500">Keep a roster of players ready to enter any tournament.</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          to="/tournaments"
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700"
        >
          View Tournaments
        </Link>
        <Link
          to="/players"
          className="bg-white border text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50"
        >
          Manage Players
        </Link>
      </div>
    </div>
  )
}

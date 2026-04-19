import { Link } from 'react-router-dom'
import { type Tournament } from '../lib/types'

const statusColors: Record<string, string> = {
  setup: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  finished: 'bg-gray-100 text-gray-500',
}

export default function TournamentCard({ t }: { t: Tournament }) {
  return (
    <Link
      to={`/tournaments/${t.id}`}
      className="block border rounded-xl p-4 bg-white hover:shadow-md transition"
    >
      <div className="flex justify-between items-start">
        <h2 className="font-semibold text-gray-800">{t.name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
          {t.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {t.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin'}
      </p>
    </Link>
  )
}

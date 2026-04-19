import { Link } from 'react-router-dom'
import { type Tournament } from '../lib/types'
import { useLang } from '../lib/i18n'

const statusColors: Record<string, string> = {
  setup: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  finished: 'bg-gray-100 text-gray-500',
}

export default function TournamentCard({ t: tournament }: { t: Tournament }) {
  const { t } = useLang()
  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="block border rounded-xl p-4 bg-white hover:shadow-md transition"
    >
      <div className="flex justify-between items-start">
        <h2 className="font-semibold text-gray-800">{tournament.name}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[tournament.status]}`}>
          {t(`status_${tournament.status}` as Parameters<typeof t>[0])}
        </span>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {tournament.format === 'single_elimination' ? t('tournaments_format_single') : t('tournaments_format_rr')}
      </p>
    </Link>
  )
}

import { Link } from 'react-router-dom'
import { type Tournament } from '../lib/types'
import { useLang } from '../lib/i18n'

const statusColors: Record<string, string> = {
  setup: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  finished: 'bg-gray-100 text-gray-500',
}

interface Props {
  t: Tournament
  onRemove: (id: string) => void
}

export default function TournamentCard({ t: tournament, onRemove }: Props) {
  const { t } = useLang()

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(t('tournament_remove_confirm'))) return
    onRemove(tournament.id)
  }

  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="block border rounded-xl p-4 bg-white hover:shadow-md transition"
    >
      <div className="flex justify-between items-start">
        <h2 className="font-semibold text-gray-800">{tournament.name}</h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[tournament.status]}`}>
            {t(`status_${tournament.status}` as Parameters<typeof t>[0])}
          </span>
          <button
            onClick={handleRemove}
            className="text-red-400 hover:text-red-600 text-sm px-1"
          >
            ✕
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {tournament.format === 'single_elimination' ? t('tournaments_format_single') : tournament.format === 'round_robin' ? t('tournaments_format_rr') : t('tournaments_format_americano')}
      </p>
    </Link>
  )
}

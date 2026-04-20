import { useEffect, useState } from 'react'
import { type Tournament, type TournamentFormat } from '../lib/types'
import * as db from '../lib/db'
import TournamentCard from '../components/TournamentCard'

import { useLang } from '../lib/i18n'

export default function TournamentsPage() {
  const { t } = useLang()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [name, setName] = useState('')
  const [format, setFormat] = useState<TournamentFormat>('single_elimination')

  function load() {
    setTournaments(db.getTournaments())
  }

  useEffect(() => { load() }, [])

  function deleteTournament(id: string) {
    db.removeTournament(id)
    load()
  }

  function createTournament() {
    const trimmed = name.trim()
    if (!trimmed) return
    db.addTournament(trimmed, format)
    setName('')
    load()
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('tournaments_heading')}</h1>

      <div className="border rounded-xl p-4 bg-white mb-6 space-y-3">
        <h2 className="font-semibold text-gray-700">{t('tournaments_new')}</h2>
        <input
          type="text"
          placeholder={t('tournaments_name_placeholder')}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createTournament()}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex gap-4">
          {(['single_elimination', 'round_robin', 'americano'] as TournamentFormat[]).map(f => (
            <label key={f} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="format"
                value={f}
                checked={format === f}
                onChange={() => setFormat(f)}
                className="accent-green-600"
              />
              <span className="text-sm text-gray-700">
                {f === 'single_elimination' ? t('tournaments_format_single') : f === 'round_robin' ? t('tournaments_format_rr') : t('tournaments_format_americano')}
              </span>
            </label>
          ))}
        </div>
        <button
          onClick={createTournament}
          disabled={!name.trim()}
          className="w-full bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-50"
        >
          {t('tournaments_create')}
        </button>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-gray-400 text-center py-8">{t('tournaments_empty')}</p>
      ) : (
        <div className="space-y-3">
          {tournaments.map(tournament => <TournamentCard key={tournament.id} t={tournament} onRemove={deleteTournament} />)}
        </div>
      )}
    </div>
  )
}

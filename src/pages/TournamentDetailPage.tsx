import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { type Tournament, type Player, type Match } from '../lib/types'
import * as db from '../lib/db'
import { generateSingleEliminationMatches, generateRoundRobinMatches } from '../lib/tournament'
import BracketView from '../components/BracketView'
import RoundRobinView from '../components/RoundRobinView'
import { useLang } from '../lib/i18n'

export default function TournamentDetailPage() {
  const { t } = useLang()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [participants, setParticipants] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  function load() {
    if (!id) return
    const tour = db.getTournament(id)
    if (!tour) return
    setTournament(tour)
    setAllPlayers(db.getPlayers())
    setParticipants(db.getTournamentPlayers(id).map(tp => tp.player))
    setMatches(db.getMatches(id))
  }

  useEffect(() => { load() }, [id])

  function addParticipant(playerId: string) {
    db.addTournamentPlayer(id!, playerId, participants.length + 1)
    load()
  }

  function removeParticipant(playerId: string) {
    db.removeTournamentPlayer(id!, playerId)
    load()
  }

  function startTournament() {
    if (participants.length < 2) return alert(t('detail_need_players'))
    const newMatches = tournament!.format === 'single_elimination'
      ? generateSingleEliminationMatches(id!, participants)
      : generateRoundRobinMatches(id!, participants)
    db.insertMatches(newMatches)
    db.updateTournament(id!, { status: 'active' })
    load()
  }

  function finishTournament() {
    db.updateTournament(id!, { status: 'finished' })
    load()
  }

  if (!tournament) return <p className="text-center py-16 text-gray-400">{t('detail_not_found')}</p>

  const availablePlayers = allPlayers.filter(p => !participants.find(pp => pp.id === p.id))

  const formatLabel = tournament.format === 'single_elimination'
    ? t('tournaments_format_single')
    : t('tournaments_format_rr')

  const statusLabel = t(`status_${tournament.status}` as Parameters<typeof t>[0])

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button onClick={() => navigate('/tournaments')} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
        {t('detail_back')}
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{tournament.name}</h1>
          <p className="text-sm text-gray-500">
            {formatLabel} ·{' '}
            <span className={
              tournament.status === 'active' ? 'text-green-600' :
              tournament.status === 'finished' ? 'text-gray-400' : 'text-yellow-600'
            }>
              {statusLabel}
            </span>
          </p>
        </div>
        {tournament.status === 'active' && (
          <button
            onClick={finishTournament}
            className="text-sm border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            {t('detail_mark_finished')}
          </button>
        )}
      </div>

      {tournament.status === 'setup' && (
        <div className="mb-8 space-y-4">
          <h2 className="font-semibold text-gray-700">{t('detail_participants')} ({participants.length})</h2>
          {participants.length > 0 && (
            <ul className="space-y-2">
              {participants.map(p => (
                <li key={p.id} className="flex items-center justify-between border rounded-lg px-4 py-2 bg-white">
                  <span className="text-gray-700">{p.name}</span>
                  <button onClick={() => removeParticipant(p.id)} className="text-red-500 text-sm hover:text-red-700">
                    {t('players_remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {availablePlayers.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">{t('detail_add_player')}</p>
              <div className="flex flex-wrap gap-2">
                {availablePlayers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addParticipant(p.id)}
                    className="border rounded-full px-3 py-1 text-sm hover:border-green-500 hover:text-green-700"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {allPlayers.length === 0 && (
            <p className="text-sm text-gray-400">{t('detail_no_players')}</p>
          )}
          <button
            onClick={startTournament}
            disabled={participants.length < 2}
            className="mt-2 bg-green-600 text-white rounded-lg px-6 py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {t('detail_start')}
          </button>
        </div>
      )}

      {(tournament.status === 'active' || tournament.status === 'finished') && (
        tournament.format === 'single_elimination'
          ? <BracketView matches={matches} onRefresh={load} />
          : <RoundRobinView matches={matches} players={participants} onRefresh={load} />
      )}
    </div>
  )
}

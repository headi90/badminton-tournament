import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { type Tournament, type Player, type Match } from '../lib/types'
import * as db from '../lib/db'
import { generateSingleEliminationMatches, generateRoundRobinMatches, generateAmericanoMatches } from '../lib/tournament'
import BracketView from '../components/BracketView'
import RoundRobinView from '../components/RoundRobinView'
import AmericanoView from '../components/AmericanoView'
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

  function addAllParticipants() {
    availablePlayers.forEach((p, i) => db.addTournamentPlayer(id!, p.id, participants.length + i + 1))
    load()
  }

  function removeParticipant(playerId: string) {
    db.removeTournamentPlayer(id!, playerId)
    load()
  }

  function removeAllParticipants() {
    participants.forEach(p => db.removeTournamentPlayer(id!, p.id))
    load()
  }

  function startTournament() {
    if (tournament!.format === 'americano' && participants.length < 4)
      return alert(t('detail_need_players_americano'))
    if (tournament!.format !== 'americano' && participants.length < 2)
      return alert(t('detail_need_players'))
    const newMatches = tournament!.format === 'single_elimination'
      ? generateSingleEliminationMatches(id!, participants)
      : tournament!.format === 'round_robin'
      ? generateRoundRobinMatches(id!, participants)
      : generateAmericanoMatches(id!, participants)
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
    : tournament.format === 'round_robin'
    ? t('tournaments_format_rr')
    : t('tournaments_format_americano')

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
          {availablePlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{t('detail_add_player')}</p>
                <button
                  onClick={addAllParticipants}
                  className="text-xs text-green-700 border border-green-600 rounded-full px-3 py-0.5 hover:bg-green-50"
                >
                  {t('detail_add_all')}
                </button>
              </div>
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
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">{t('detail_participants')} ({participants.length})</h2>
            {participants.length > 0 && (
              <button
                onClick={removeAllParticipants}
                className="text-xs text-red-500 border border-red-400 rounded-full px-3 py-0.5 hover:bg-red-50"
              >
                {t('detail_remove_all')}
              </button>
            )}
          </div>
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
          : tournament.format === 'round_robin'
          ? <RoundRobinView matches={matches} players={participants} onRefresh={load} />
          : <AmericanoView matches={matches} players={participants} onRefresh={load} />
      )}
    </div>
  )
}

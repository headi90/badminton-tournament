import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Tournament, type Player, type Match } from '../lib/supabase'
import {
  generateSingleEliminationMatches,
  generateRoundRobinMatches,
} from '../lib/tournament'
import BracketView from '../components/BracketView'
import RoundRobinView from '../components/RoundRobinView'

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [participants, setParticipants] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  async function load() {
    const [{ data: t }, { data: p }, { data: tp }, { data: m }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('players').select('*').order('name'),
      supabase.from('tournament_players').select('*, player:players(*)').eq('tournament_id', id).order('seed'),
      supabase.from('matches').select('*, player1:players!matches_player1_id_fkey(*), player2:players!matches_player2_id_fkey(*)').eq('tournament_id', id).order('round').order('position'),
    ])
    setTournament(t)
    setAllPlayers(p ?? [])
    setParticipants((tp ?? []).map((r: any) => r.player).filter(Boolean))
    setMatches(m ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function addParticipant(playerId: string) {
    const seed = participants.length + 1
    await supabase.from('tournament_players').insert({ tournament_id: id, player_id: playerId, seed })
    load()
  }

  async function removeParticipant(playerId: string) {
    await supabase.from('tournament_players').delete().eq('tournament_id', id).eq('player_id', playerId)
    load()
  }

  async function startTournament() {
    if (participants.length < 2) return alert('Need at least 2 players.')
    setStarting(true)
    const newMatches =
      tournament!.format === 'single_elimination'
        ? generateSingleEliminationMatches(id!, participants)
        : generateRoundRobinMatches(id!, participants)
    await supabase.from('matches').insert(newMatches)
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', id)
    setStarting(false)
    load()
  }

  async function finishTournament() {
    await supabase.from('tournaments').update({ status: 'finished' }).eq('id', id)
    load()
  }

  if (loading) return <p className="text-center py-16 text-gray-400">Loading…</p>
  if (!tournament) return <p className="text-center py-16 text-gray-400">Not found.</p>

  const availablePlayers = allPlayers.filter(p => !participants.find(pp => pp.id === p.id))

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button onClick={() => navigate('/tournaments')} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
        ← Tournaments
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{tournament.name}</h1>
          <p className="text-sm text-gray-500">
            {tournament.format === 'single_elimination' ? 'Single Elimination' : 'Round Robin'} ·{' '}
            <span className={
              tournament.status === 'active' ? 'text-green-600' :
              tournament.status === 'finished' ? 'text-gray-400' : 'text-yellow-600'
            }>
              {tournament.status}
            </span>
          </p>
        </div>
        {tournament.status === 'active' && (
          <button
            onClick={finishTournament}
            className="text-sm border border-gray-300 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            Mark Finished
          </button>
        )}
      </div>

      {tournament.status === 'setup' && (
        <div className="mb-8 space-y-4">
          <h2 className="font-semibold text-gray-700">Participants ({participants.length})</h2>
          {participants.length > 0 && (
            <ul className="space-y-2">
              {participants.map(p => (
                <li key={p.id} className="flex items-center justify-between border rounded-lg px-4 py-2 bg-white">
                  <span className="text-gray-700">{p.name}</span>
                  <button onClick={() => removeParticipant(p.id)} className="text-red-500 text-sm hover:text-red-700">Remove</button>
                </li>
              ))}
            </ul>
          )}
          {availablePlayers.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Add player:</p>
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
          <button
            onClick={startTournament}
            disabled={participants.length < 2 || starting}
            className="mt-2 bg-green-600 text-white rounded-lg px-6 py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {starting ? 'Starting…' : 'Start Tournament'}
          </button>
        </div>
      )}

      {(tournament.status === 'active' || tournament.status === 'finished') && (
        <>
          {tournament.format === 'single_elimination' ? (
            <BracketView matches={matches} onRefresh={load} />
          ) : (
            <RoundRobinView matches={matches} players={participants} onRefresh={load} />
          )}
        </>
      )}
    </div>
  )
}

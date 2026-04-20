import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { type Player, type Match } from '../lib/types'
import * as db from '../lib/db'
import { useLang } from '../lib/i18n'

type HistoryMatch = Match & { tournamentName: string }

function resultLabel(match: HistoryMatch, playerId: string, t: (k: any) => string): { label: string; color: string } {
  if (match.status !== 'completed') return { label: t('profile_pending'), color: 'text-gray-400' }
  const isAmericano = match.player3_id != null
  if (isAmericano) {
    const onTeam1 = match.player1_id === playerId || match.player2_id === playerId
    const pts = onTeam1 ? match.score1 : match.score2
    return { label: `${pts ?? 0} pts`, color: 'text-green-700' }
  }
  if (match.winner_id === playerId) return { label: t('profile_win'), color: 'text-green-700 font-bold' }
  return { label: t('profile_loss'), color: 'text-red-500' }
}

function opponentLabel(match: HistoryMatch, playerId: string): string {
  const isAmericano = match.player3_id != null
  if (isAmericano) {
    const onTeam1 = match.player1_id === playerId || match.player2_id === playerId
    if (onTeam1) {
      const partner = match.player1_id === playerId ? match.player2 : match.player1
      const opp1 = match.player3?.name ?? 'TBD'
      const opp2 = match.player4?.name ?? 'TBD'
      return `w/ ${partner?.name ?? 'TBD'} vs ${opp1} & ${opp2}`
    } else {
      const partner = match.player3_id === playerId ? match.player4 : match.player3
      const opp1 = match.player1?.name ?? 'TBD'
      const opp2 = match.player2?.name ?? 'TBD'
      return `w/ ${partner?.name ?? 'TBD'} vs ${opp1} & ${opp2}`
    }
  }
  const opp = match.player1_id === playerId ? match.player2 : match.player1
  const score = match.status === 'completed' ? ` (${match.score1}–${match.score2})` : ''
  return `vs ${opp?.name ?? 'TBD'}${score}`
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLang()
  const [player, setPlayer] = useState<Player | null>(null)
  const [history, setHistory] = useState<HistoryMatch[]>([])

  useEffect(() => {
    if (!id) return
    const p = db.getPlayers().find(p => p.id === id)
    if (!p) return
    setPlayer(p)
    setHistory(db.getPlayerMatchHistory(id))
  }, [id])

  if (!player) return <p className="text-center py-16 text-gray-400">{t('detail_not_found')}</p>

  const completed = history.filter(m => m.status === 'completed')
  const wins = completed.filter(m => m.winner_id === id).length
  const losses = completed.filter(m => m.winner_id && m.winner_id !== id && (m.player1_id === id || m.player2_id === id)).length

  // group by tournament
  const byTournament: Record<string, { name: string; matches: HistoryMatch[] }> = {}
  for (const m of history) {
    if (!byTournament[m.tournament_id]) byTournament[m.tournament_id] = { name: m.tournamentName, matches: [] }
    byTournament[m.tournament_id].matches.push(m)
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <button onClick={() => navigate('/players')} className="text-sm text-gray-400 hover:text-gray-600 mb-4">
        {t('profile_back')}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl font-bold text-green-700">
          {player.name[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
      </div>

      {completed.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{completed.length}</p>
            <p className="text-xs text-gray-400">{t('profile_games')}</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{wins}</p>
            <p className="text-xs text-gray-400">{t('profile_wins')}</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-500">{losses}</p>
            <p className="text-xs text-gray-400">{t('profile_losses')}</p>
          </div>
        </div>
      )}

      {Object.keys(byTournament).length === 0 ? (
        <p className="text-gray-400 text-center py-8">{t('profile_no_history')}</p>
      ) : (
        <div className="space-y-6">
          {Object.values(byTournament).map(({ name, matches }) => (
            <div key={name}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{name}</p>
              <div className="space-y-2">
                {matches.map(m => {
                  const { label, color } = resultLabel(m, id!, t)
                  return (
                    <div key={m.id} className="flex items-center justify-between border rounded-lg px-4 py-2 bg-white text-sm">
                      <span className="text-gray-600 truncate max-w-[240px]">{opponentLabel(m, id!)}</span>
                      <span className={color}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

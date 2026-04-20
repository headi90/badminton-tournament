import { useState } from 'react'
import { type Match, type Player } from '../lib/types'
import { computeAmericanoStandings } from '../lib/tournament'
import MatchModal from './MatchModal'
import { useLang } from '../lib/i18n'

interface Props {
  matches: Match[]
  players: Player[]
  onRefresh: () => void
  finished?: boolean
  totalRounds: number
  onNextRound: () => void
}

export default function AmericanoView({ matches, players, onRefresh, finished, totalRounds, onNextRound }: Props) {
  const { t } = useLang()
  const [selected, setSelected] = useState<Match | null>(null)
  const standings = computeAmericanoStandings(matches, players)

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)
  const currentRound = rounds.length > 0 ? Math.max(...rounds) : 0
  const currentRoundMatches = matches.filter(m => m.round === currentRound)
  const currentRoundComplete = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'completed')
  const canAddNextRound = !finished && currentRoundComplete && currentRound < totalRounds

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold text-slate-300 mb-3">{t('americano_standings')}</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">{t('americano_col_player')}</th>
                <th className="px-4 py-2">{t('americano_col_games')}</th>
                <th className="px-4 py-2">{t('americano_col_points')}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.player.id} className={`border-t border-slate-800 ${i === 0 ? 'bg-green-500/5' : 'bg-slate-900'}`}>
                  <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-slate-200">{row.player.name}</td>
                  <td className="px-4 py-2 text-center text-slate-400">{row.gamesPlayed}</td>
                  <td className="px-4 py-2 text-center font-bold text-green-400">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-300">{t('americano_schedule')}</h3>
          <span className="text-xs text-slate-500">
            {t('americano_round')} {currentRound}/{totalRounds}
          </span>
        </div>
        <div className="space-y-4">
          {rounds.map(round => (
            <div key={round}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {t('americano_round')} {round}
              </p>
              <div className="space-y-2">
                {matches
                  .filter(m => m.round === round)
                  .map(match => (
                    <div
                      key={match.id}
                      onClick={() => !finished && setSelected(match)}
                      className={`border rounded-xl px-4 py-3 transition-colors ${
                        match.status === 'completed'
                          ? 'bg-slate-900/50 border-slate-800'
                          : 'bg-slate-900 border-slate-800'
                      } ${!finished ? 'cursor-pointer hover:border-green-500/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium text-slate-200">{match.player1?.name}</span>
                          <span className="text-slate-600 mx-1">&</span>
                          <span className="font-medium text-slate-200">{match.player2?.name}</span>
                        </div>
                        <span className={`text-sm mx-4 font-mono ${match.status === 'completed' ? 'text-slate-300 font-semibold' : 'text-slate-600'}`}>
                          {match.status === 'completed'
                            ? `${match.score1} — ${match.score2}`
                            : 'vs'}
                        </span>
                        <div className="text-sm text-right">
                          <span className="font-medium text-slate-200">{match.player3?.name}</span>
                          <span className="text-slate-600 mx-1">&</span>
                          <span className="font-medium text-slate-200">{match.player4?.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {canAddNextRound && (
          <button
            onClick={onNextRound}
            className="mt-4 w-full bg-green-600 text-white rounded-xl py-2.5 font-medium hover:bg-green-500 transition-colors"
          >
            {t('americano_next_round')} ({currentRound + 1}/{totalRounds})
          </button>
        )}
      </div>

      {selected && (
        <MatchModal
          match={selected}
          allMatches={matches}
          format="americano"
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); onRefresh() }}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { type Match, type Player } from '../lib/types'
import { computeAmericanoStandings } from '../lib/tournament'
import MatchModal from './MatchModal'
import { useLang } from '../lib/i18n'

interface Props {
  matches: Match[]
  players: Player[]
  onRefresh: () => void
}

export default function AmericanoView({ matches, players, onRefresh }: Props) {
  const { t } = useLang()
  const [selected, setSelected] = useState<Match | null>(null)
  const standings = computeAmericanoStandings(matches, players)

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('americano_standings')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">{t('americano_col_player')}</th>
                <th className="px-4 py-2">{t('americano_col_games')}</th>
                <th className="px-4 py-2">{t('americano_col_points')}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.player.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{row.player.name}</td>
                  <td className="px-4 py-2 text-center text-gray-500">{row.gamesPlayed}</td>
                  <td className="px-4 py-2 text-center font-bold text-green-700">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('americano_schedule')}</h3>
        <div className="space-y-4">
          {rounds.map(round => (
            <div key={round}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                {t('americano_round')} {round}
              </p>
              <div className="space-y-2">
                {matches
                  .filter(m => m.round === round)
                  .map(match => {
                    const canClick = match.status === 'pending' &&
                      match.player1_id && match.player2_id &&
                      match.player3_id && match.player4_id
                    return (
                      <div
                        key={match.id}
                        onClick={() => canClick ? setSelected(match) : undefined}
                        className={`border rounded-lg px-4 py-3 bg-white ${canClick ? 'cursor-pointer hover:border-green-500' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-gray-800">{match.player1?.name}</span>
                            <span className="text-gray-400 mx-1">&</span>
                            <span className="font-medium text-gray-800">{match.player2?.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm mx-4">
                            {match.status === 'completed'
                              ? `${match.score1} — ${match.score2}`
                              : 'vs'}
                          </span>
                          <div className="text-sm text-right">
                            <span className="font-medium text-gray-800">{match.player3?.name}</span>
                            <span className="text-gray-400 mx-1">&</span>
                            <span className="font-medium text-gray-800">{match.player4?.name}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
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

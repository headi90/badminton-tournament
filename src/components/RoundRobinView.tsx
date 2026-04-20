import { useState } from 'react'
import { type Match, type Player } from '../lib/types'
import { computeStandings } from '../lib/tournament'
import MatchModal from './MatchModal'
import { useLang } from '../lib/i18n'

interface Props {
  matches: Match[]
  players: Player[]
  onRefresh: () => void
  finished?: boolean
}

export default function RoundRobinView({ matches, players, onRefresh, finished }: Props) {
  const { t } = useLang()
  const [selected, setSelected] = useState<Match | null>(null)
  const standings = computeStandings(matches, players)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('rr_standings')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">{t('rr_col_player')}</th>
                <th className="px-4 py-2">{t('rr_col_wins')}</th>
                <th className="px-4 py-2">{t('rr_col_losses')}</th>
                <th className="px-4 py-2">{t('rr_col_pts')}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.player.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{row.player.name}</td>
                  <td className="px-4 py-2 text-center text-green-700">{row.wins}</td>
                  <td className="px-4 py-2 text-center text-red-500">{row.losses}</td>
                  <td className="px-4 py-2 text-center font-bold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">{t('rr_schedule')}</h3>
        <div className="space-y-2">
          {matches
            .sort((a, b) => a.position - b.position)
            .map(match => (
              <div
                key={match.id}
                onClick={() => !finished && setSelected(match)}
                className={`flex items-center justify-between border rounded-lg px-4 py-3 bg-white ${
                  finished ? '' : 'cursor-pointer hover:border-green-500'
                } ${match.status === 'completed' ? 'bg-gray-50' : ''}`}
              >
                <span className={`font-medium ${match.winner_id === match.player1_id ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                  {match.player1?.name ?? 'TBD'}
                </span>
                <span className="text-gray-400 text-sm mx-4">
                  {match.status === 'completed'
                    ? `${match.score1} — ${match.score2}`
                    : 'vs'}
                </span>
                <span className={`font-medium ${match.winner_id === match.player2_id ? 'text-green-700 font-bold' : 'text-gray-700'}`}>
                  {match.player2?.name ?? 'TBD'}
                </span>
              </div>
            ))}
        </div>
      </div>

      {selected && (
        <MatchModal
          match={selected}
          allMatches={matches}
          format="round_robin"
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); onRefresh() }}
        />
      )}
    </div>
  )
}

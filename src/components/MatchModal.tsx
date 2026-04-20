import { useState } from 'react'
import { type Match } from '../lib/types'
import * as db from '../lib/db'
import { useLang } from '../lib/i18n'

interface Props {
  match: Match
  allMatches: Match[]
  format: 'single_elimination' | 'round_robin' | 'americano'
  onClose: () => void
  onSaved: () => void
}

export default function MatchModal({ match, allMatches, format, onClose, onSaved }: Props) {
  const { t } = useLang()
  const [score1, setScore1] = useState(match.score1 ?? 0)
  const [score2, setScore2] = useState(match.score2 ?? 0)

  const isAmericano = format === 'americano'
  const tied = score1 === score2

  const leftLabel = isAmericano
    ? `${match.player1?.name ?? 'TBD'} & ${match.player2?.name ?? 'TBD'}`
    : (match.player1?.name ?? 'TBD')

  const rightLabel = isAmericano
    ? `${match.player3?.name ?? 'TBD'} & ${match.player4?.name ?? 'TBD'}`
    : (match.player2?.name ?? 'TBD')

  async function handleSave() {
    if (score1 < 0 || score2 < 0) return
    if (isAmericano) {
      await db.updateMatch(match.id, { score1, score2, status: 'completed' })
      onSaved()
      return
    }
    if (!match.player1_id || !match.player2_id || tied) return
    const winnerId = score1 > score2 ? match.player1_id : match.player2_id
    await db.updateMatch(match.id, { score1, score2, winner_id: winnerId, status: 'completed' })
    if (format === 'single_elimination') {
      await db.advanceSingleElimWinner({ ...match, score1, score2, winner_id: winnerId, status: 'completed' }, allMatches)
    }
    onSaved()
  }

  const scoresValid = score1 >= 0 && score2 >= 0
  const canSave = scoresValid && (isAmericano
    ? (match.player1_id && match.player2_id && match.player3_id && match.player4_id)
    : (!tied && match.player1_id && match.player2_id))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('match_title')}</h2>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 text-center">
            <p className="font-medium text-gray-700 mb-2 text-sm leading-tight">{leftLabel}</p>
            <input
              type="number"
              min={0}
              value={score1}
              onChange={e => setScore1(Number(e.target.value))}
              className="w-16 text-center border rounded-lg p-2 text-xl font-bold"
            />
          </div>
          <span className="text-gray-400 font-bold">vs</span>
          <div className="flex-1 text-center">
            <p className="font-medium text-gray-700 mb-2 text-sm leading-tight">{rightLabel}</p>
            <input
              type="number"
              min={0}
              value={score2}
              onChange={e => setScore2(Number(e.target.value))}
              className="w-16 text-center border rounded-lg p-2 text-xl font-bold"
            />
          </div>
        </div>
        {!isAmericano && tied && (
          <p className="text-amber-600 text-sm mb-3 text-center">{t('match_tied')}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 hover:bg-gray-50">
            {t('match_cancel')}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {t('match_save')}
          </button>
        </div>
      </div>
    </div>
  )
}

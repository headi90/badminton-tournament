import { useState } from 'react'
import { supabase, type Match } from '../lib/supabase'
import { advanceSingleElimWinner } from '../lib/tournament'

interface Props {
  match: Match
  allMatches: Match[]
  format: 'single_elimination' | 'round_robin'
  onClose: () => void
  onSaved: () => void
}

export default function MatchModal({ match, allMatches, format, onClose, onSaved }: Props) {
  const [score1, setScore1] = useState(match.score1 ?? 0)
  const [score2, setScore2] = useState(match.score2 ?? 0)
  const [saving, setSaving] = useState(false)

  const p1Name = match.player1?.name ?? 'TBD'
  const p2Name = match.player2?.name ?? 'TBD'

  async function handleSave() {
    if (!match.player1_id || !match.player2_id) return
    setSaving(true)
    const winnerId = score1 > score2 ? match.player1_id : match.player2_id
    await supabase.from('matches').update({
      score1,
      score2,
      winner_id: winnerId,
      status: 'completed',
    }).eq('id', match.id)

    if (format === 'single_elimination') {
      const updatedMatch = { ...match, score1, score2, winner_id: winnerId, status: 'completed' as const }
      await advanceSingleElimWinner(match.tournament_id, updatedMatch, allMatches)
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Enter Match Result</h2>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 text-center">
            <p className="font-medium text-gray-700 mb-2">{p1Name}</p>
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
            <p className="font-medium text-gray-700 mb-2">{p2Name}</p>
            <input
              type="number"
              min={0}
              value={score2}
              onChange={e => setScore2(Number(e.target.value))}
              className="w-16 text-center border rounded-lg p-2 text-xl font-bold"
            />
          </div>
        </div>
        {score1 === score2 && (
          <p className="text-amber-600 text-sm mb-3 text-center">Scores must not be equal.</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || score1 === score2 || !match.player1_id || !match.player2_id}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

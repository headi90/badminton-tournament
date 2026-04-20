import { useState } from 'react'
import { type Match } from '../lib/types'
import * as db from '../lib/db'
import { useAuth } from '../lib/auth'
import MatchModal from './MatchModal'
import { useLang } from '../lib/i18n'

interface Props {
  matches: Match[]
  onRefresh: () => void
  finished?: boolean
}

export default function BracketView({ matches, onRefresh, finished }: Props) {
  const { t } = useLang()
  const { isAdmin } = useAuth()
  const [selected, setSelected] = useState<Match | null>(null)
  const [originalMatch, setOriginalMatch] = useState<Match | null>(null)

  function openPending(match: Match) {
    setSelected(match)
    setOriginalMatch(null)
  }

  async function openEdit(match: Match) {
    await db.undoSingleElimAdvance(match)
    onRefresh()
    setOriginalMatch(match)
    setSelected(match)
  }

  async function handleClose() {
    if (originalMatch) {
      await db.advanceSingleElimWinner(originalMatch, matches)
      onRefresh()
    }
    setSelected(null)
    setOriginalMatch(null)
  }

  function handleSaved() {
    setSelected(null)
    setOriginalMatch(null)
    onRefresh()
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max p-4">
          {rounds.map(round => (
            <div key={round} className="flex flex-col gap-4 justify-around">
              <h3 className="text-sm font-semibold text-gray-500 text-center mb-2">
                {t('bracket_round')} {round}
              </h3>
              {matches
                .filter(m => m.round === round)
                .sort((a, b) => a.position - b.position)
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    canEdit={isAdmin && !finished && db.canUndoSingleElim(match, matches)}
                    onEdit={() => void openEdit(match)}
                    onClick={() => isAdmin && !finished && match.status === 'pending' && openPending(match)}
                    editLabel={t('match_edit')}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <MatchModal
          match={selected}
          allMatches={matches}
          format="single_elimination"
          onClose={() => void handleClose()}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function MatchCard({ match, canEdit, onEdit, onClick, editLabel }: {
  match: Match
  canEdit: boolean
  onEdit: () => void
  onClick: () => void
  editLabel: string
}) {
  const canPlay = match.status === 'pending' && match.player1_id && match.player2_id
  return (
    <div
      onClick={canPlay ? onClick : undefined}
      className={`border rounded-lg p-3 w-40 ${
        canPlay ? 'cursor-pointer hover:border-green-500 hover:shadow-sm' : ''
      } ${match.status === 'completed' ? 'bg-gray-50' : 'bg-white'}`}
    >
      <PlayerLine
        name={match.player1?.name}
        score={match.score1}
        won={match.winner_id === match.player1_id}
        completed={match.status === 'completed'}
      />
      <div className="border-t my-1" />
      <PlayerLine
        name={match.player2?.name}
        score={match.score2}
        won={match.winner_id === match.player2_id}
        completed={match.status === 'completed'}
      />
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className="mt-1.5 w-full text-xs text-gray-400 hover:text-green-600"
        >
          ✎ {editLabel}
        </button>
      )}
    </div>
  )
}

function PlayerLine({
  name,
  score,
  won,
  completed,
}: {
  name?: string
  score: number | null
  won: boolean
  completed: boolean
}) {
  return (
    <div className={`flex justify-between items-center text-sm ${won ? 'font-bold text-green-700' : 'text-gray-600'}`}>
      <span className="truncate max-w-[90px]">{name ?? 'TBD'}</span>
      {completed && <span>{score}</span>}
    </div>
  )
}

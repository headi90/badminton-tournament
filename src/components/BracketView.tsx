import { useState } from 'react'
import { type Match } from '../lib/supabase'
import MatchModal from './MatchModal'

interface Props {
  matches: Match[]
  onRefresh: () => void
}

export default function BracketView({ matches, onRefresh }: Props) {
  const [selected, setSelected] = useState<Match | null>(null)

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b)

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max p-4">
          {rounds.map(round => (
            <div key={round} className="flex flex-col gap-4 justify-around">
              <h3 className="text-sm font-semibold text-gray-500 text-center mb-2">
                Round {round}
              </h3>
              {matches
                .filter(m => m.round === round)
                .sort((a, b) => a.position - b.position)
                .map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => match.status === 'pending' && setSelected(match)}
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
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); onRefresh() }}
        />
      )}
    </div>
  )
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
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

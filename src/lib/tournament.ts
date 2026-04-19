import { supabase, type Player, type Match } from './supabase'

export function generateSingleEliminationMatches(
  tournamentId: string,
  players: Player[]
): Omit<Match, 'id' | 'player1' | 'player2'>[] {
  const count = players.length
  const rounds = Math.ceil(Math.log2(count))
  const slots = Math.pow(2, rounds)
  const matches: Omit<Match, 'id' | 'player1' | 'player2'>[] = []

  // First round: fill slots, byes where count < slots
  for (let pos = 0; pos < slots / 2; pos++) {
    const p1 = players[pos * 2] ?? null
    const p2 = players[pos * 2 + 1] ?? null
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      position: pos,
      player1_id: p1?.id ?? null,
      player2_id: p2?.id ?? null,
      score1: null,
      score2: null,
      winner_id: p2 === null && p1 ? p1.id : null, // auto-advance if bye
      status: p2 === null && p1 ? 'completed' : 'pending',
    })
  }

  // Subsequent rounds: placeholders
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = slots / Math.pow(2, round)
    for (let pos = 0; pos < matchesInRound; pos++) {
      matches.push({
        tournament_id: tournamentId,
        round,
        position: pos,
        player1_id: null,
        player2_id: null,
        score1: null,
        score2: null,
        winner_id: null,
        status: 'pending',
      })
    }
  }

  return matches
}

export function generateRoundRobinMatches(
  tournamentId: string,
  players: Player[]
): Omit<Match, 'id' | 'player1' | 'player2'>[] {
  const matches: Omit<Match, 'id' | 'player1' | 'player2'>[] = []
  let position = 0
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        tournament_id: tournamentId,
        round: 1,
        position: position++,
        player1_id: players[i].id,
        player2_id: players[j].id,
        score1: null,
        score2: null,
        winner_id: null,
        status: 'pending',
      })
    }
  }
  return matches
}

export function computeStandings(matches: Match[], players: Player[]) {
  const stats: Record<string, { wins: number; losses: number; points: number }> = {}
  for (const p of players) {
    stats[p.id] = { wins: 0, losses: 0, points: 0 }
  }
  for (const m of matches) {
    if (m.status !== 'completed' || !m.winner_id) continue
    const loserId = m.player1_id === m.winner_id ? m.player2_id : m.player1_id
    if (m.winner_id && stats[m.winner_id]) {
      stats[m.winner_id].wins++
      stats[m.winner_id].points += 2
    }
    if (loserId && stats[loserId]) {
      stats[loserId].losses++
    }
  }
  return players
    .map(p => ({ player: p, ...stats[p.id] }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
}

export async function advanceSingleElimWinner(
  _tournamentId: string,
  match: Match,
  allMatches: Match[]
) {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const nextMatch = allMatches.find(
    m => m.round === nextRound && m.position === nextPos
  )
  if (!nextMatch) return

  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'
  await supabase
    .from('matches')
    .update({ [slot]: match.winner_id })
    .eq('id', nextMatch.id)
}

import type { Player, Match } from './types'

export function generateSingleEliminationMatches(
  tournamentId: string,
  players: Player[]
): Omit<Match, 'id' | 'player1' | 'player2'>[] {
  const rounds = Math.ceil(Math.log2(players.length))
  const slots = Math.pow(2, rounds)
  const matches: Omit<Match, 'id' | 'player1' | 'player2'>[] = []

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
      winner_id: p2 === null && p1 ? p1.id : null,
      status: p2 === null && p1 ? 'completed' : 'pending',
    })
  }

  for (let round = 2; round <= rounds; round++) {
    const count = slots / Math.pow(2, round)
    for (let pos = 0; pos < count; pos++) {
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
    if (stats[m.winner_id]) {
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

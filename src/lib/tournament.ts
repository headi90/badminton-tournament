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

// Circle-rotation Americano schedule.
// Each round: fix players[0], rotate the rest. Groups of 4 form a court.
// team1 = arr[base]+arr[base+1], team2 = arr[base+2]+arr[base+3]
export function generateAmericanoMatches(
  tournamentId: string,
  players: Player[]
): Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[] {
  const n = players.length
  const numRounds = n - 1
  const courts = Math.floor(n / 4)
  const matches: Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[] = []
  let position = 0

  for (let round = 0; round < numRounds; round++) {
    const arr: Player[] = [players[0]]
    for (let i = 1; i < n; i++) {
      arr.push(players[1 + ((i - 1 + round) % (n - 1))])
    }
    for (let c = 0; c < courts; c++) {
      const b = c * 4
      matches.push({
        tournament_id: tournamentId,
        round: round + 1,
        position: position++,
        player1_id: arr[b].id,
        player2_id: arr[b + 1].id,
        player3_id: arr[b + 2].id,
        player4_id: arr[b + 3].id,
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

export function computeAmericanoStandings(matches: Match[], players: Player[]) {
  const stats: Record<string, { gamesPlayed: number; points: number }> = {}
  for (const p of players) {
    stats[p.id] = { gamesPlayed: 0, points: 0 }
  }
  for (const m of matches) {
    if (m.status !== 'completed') continue
    const team1 = [m.player1_id, m.player2_id].filter(Boolean) as string[]
    const team2 = [m.player3_id, m.player4_id].filter(Boolean) as string[]
    for (const pid of team1) {
      if (stats[pid]) { stats[pid].points += m.score1 ?? 0; stats[pid].gamesPlayed++ }
    }
    for (const pid of team2) {
      if (stats[pid]) { stats[pid].points += m.score2 ?? 0; stats[pid].gamesPlayed++ }
    }
  }
  return players
    .map(p => ({ player: p, ...stats[p.id] }))
    .sort((a, b) => b.points - a.points)
}

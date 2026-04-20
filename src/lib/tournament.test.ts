import { describe, it, expect } from 'vitest'
import {
  generateSingleEliminationMatches,
  generateRoundRobinMatches,
  generateAmericanoMatches,
  generateAmericanoNextRound,
  computeStandings,
  computeAmericanoStandings,
  computePodium,
  americanoTotalRounds,
} from './tournament'
import type { Match, Player } from './types'

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    created_at: new Date().toISOString(),
  }))
}

function completedMatch(overrides: Partial<Match>): Match {
  return {
    id: 'm1',
    tournament_id: 't1',
    round: 1,
    position: 0,
    player1_id: 'p1',
    player2_id: 'p2',
    score1: null,
    score2: null,
    winner_id: null,
    status: 'completed',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Single elimination
// ---------------------------------------------------------------------------

describe('generateSingleEliminationMatches', () => {
  it('generates correct number of matches for a power-of-2 field', () => {
    const players = makePlayers(8)
    const matches = generateSingleEliminationMatches('t1', players)
    // 8-player bracket: 4 + 2 + 1 = 7 matches
    expect(matches).toHaveLength(7)
  })

  it('generates correct number of matches for a non-power-of-2 field', () => {
    // 5 players → rounds = ceil(log2(5)) = 3, slots = 8 → 4 + 2 + 1 = 7
    const players = makePlayers(5)
    const matches = generateSingleEliminationMatches('t1', players)
    expect(matches).toHaveLength(7)
  })

  it('gives byes (auto-wins) to empty slots in round 1', () => {
    // 3 players → slots = 4, pos 1 has only p3 vs null → bye
    const players = makePlayers(3)
    const matches = generateSingleEliminationMatches('t1', players)
    const byeMatch = matches.find(m => m.round === 1 && m.player2_id === null)
    expect(byeMatch).toBeDefined()
    expect(byeMatch?.winner_id).toBe('p3')
    expect(byeMatch?.status).toBe('completed')
  })

  it('assigns round 1 players in seed order', () => {
    const players = makePlayers(4)
    const matches = generateSingleEliminationMatches('t1', players)
    const r1 = matches.filter(m => m.round === 1).sort((a, b) => a.position - b.position)
    expect(r1[0].player1_id).toBe('p1')
    expect(r1[0].player2_id).toBe('p2')
    expect(r1[1].player1_id).toBe('p3')
    expect(r1[1].player2_id).toBe('p4')
  })

  it('leaves later-round slots empty', () => {
    const players = makePlayers(4)
    const matches = generateSingleEliminationMatches('t1', players)
    const r2 = matches.filter(m => m.round === 2)
    expect(r2).toHaveLength(1)
    expect(r2[0].player1_id).toBeNull()
    expect(r2[0].player2_id).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Round robin
// ---------------------------------------------------------------------------

describe('generateRoundRobinMatches', () => {
  it('generates n*(n-1)/2 matches', () => {
    for (const n of [2, 3, 4, 6, 8]) {
      const matches = generateRoundRobinMatches('t1', makePlayers(n))
      expect(matches).toHaveLength((n * (n - 1)) / 2)
    }
  })

  it('every pair plays exactly once', () => {
    const players = makePlayers(4)
    const matches = generateRoundRobinMatches('t1', players)
    const pairs = matches.map(m => [m.player1_id, m.player2_id].sort().join('-'))
    const unique = new Set(pairs)
    expect(unique.size).toBe(pairs.length)
  })

  it('all matches start as pending with null scores', () => {
    const matches = generateRoundRobinMatches('t1', makePlayers(4))
    for (const m of matches) {
      expect(m.status).toBe('pending')
      expect(m.score1).toBeNull()
      expect(m.score2).toBeNull()
      expect(m.winner_id).toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// Americano
// ---------------------------------------------------------------------------

describe('generateAmericanoMatches', () => {
  it('generates only round 1', () => {
    const players = makePlayers(8)
    const matches = generateAmericanoMatches('t1', players)
    const rounds = new Set(matches.map(m => m.round))
    expect(rounds.size).toBe(1)
    expect([...rounds][0]).toBe(1)
  })

  it('round 1 has floor(n/4) courts', () => {
    const players = makePlayers(8)
    const matches = generateAmericanoMatches('t1', players)
    expect(matches).toHaveLength(2) // 8/4 = 2 courts
  })

  it('pairs 1st & 3rd vs 2nd & 4th by seed (4 players)', () => {
    const players = makePlayers(4)
    const matches = generateAmericanoMatches('t1', players)
    expect(matches).toHaveLength(1)
    const m = matches[0]
    // team 1: p1 & p3, team 2: p2 & p4
    expect(m.player1_id).toBe('p1')
    expect(m.player2_id).toBe('p3')
    expect(m.player3_id).toBe('p2')
    expect(m.player4_id).toBe('p4')
  })

  it('each player appears exactly once in round 1 (8 players)', () => {
    const players = makePlayers(8)
    const matches = generateAmericanoMatches('t1', players)
    const ids = matches.flatMap(m => [m.player1_id, m.player2_id, m.player3_id, m.player4_id])
    const unique = new Set(ids.filter(Boolean))
    expect(unique.size).toBe(8)
  })

  it('silently excludes remainder players when n is not a multiple of 4', () => {
    const players = makePlayers(6)
    const matches = generateAmericanoMatches('t1', players)
    expect(matches).toHaveLength(1) // floor(6/4) = 1 court
    const ids = matches.flatMap(m => [m.player1_id, m.player2_id, m.player3_id, m.player4_id])
    expect(ids.filter(Boolean)).toHaveLength(4)
  })
})

describe('generateAmericanoNextRound', () => {
  function americanoMatch(overrides: Partial<Match>): Match {
    return {
      id: 'm1', tournament_id: 't1', round: 1, position: 0,
      player1_id: 'p1', player2_id: 'p3', player3_id: 'p2', player4_id: 'p4',
      score1: null, score2: null, winner_id: null, status: 'completed',
      ...overrides,
    }
  }

  it('pairs by standings: highest & 3rd vs 2nd & 4th', () => {
    const players = makePlayers(4)
    // After round 1: p1=21pts, p3=21pts, p2=10pts, p4=10pts (team1 won)
    const match = americanoMatch({ score1: 21, score2: 10, status: 'completed' })
    const nextMatches = generateAmericanoNextRound('t1', 2, [match as Match], players)
    expect(nextMatches).toHaveLength(1)
    expect(nextMatches[0].round).toBe(2)
    // standings: p1=21, p3=21, p2=10, p4=10 → ranked order p1,p3,p2,p4
    // team1: rank[0]&rank[2] = p1&p2, team2: rank[1]&rank[3] = p3&p4
    const m = nextMatches[0]
    const team1 = [m.player1_id, m.player2_id].sort()
    const team2 = [m.player3_id, m.player4_id].sort()
    expect(team1).toEqual(['p1', 'p2'])
    expect(team2).toEqual(['p3', 'p4'])
  })

  it('assigns the correct round number', () => {
    const players = makePlayers(4)
    const match = americanoMatch({ score1: 15, score2: 10, status: 'completed' })
    const nextMatches = generateAmericanoNextRound('t1', 3, [match as Match], players)
    expect(nextMatches[0].round).toBe(3)
  })

  it('generates floor(n/4) courts', () => {
    const players = makePlayers(8)
    const matches: Match[] = [
      americanoMatch({ id: 'm1', player1_id: 'p1', player2_id: 'p3', player3_id: 'p2', player4_id: 'p4', score1: 21, score2: 10, status: 'completed' }),
      americanoMatch({ id: 'm2', position: 1, player1_id: 'p5', player2_id: 'p7', player3_id: 'p6', player4_id: 'p8', score1: 15, score2: 12, status: 'completed' }),
    ]
    const nextMatches = generateAmericanoNextRound('t1', 2, matches, players)
    expect(nextMatches).toHaveLength(2)
  })
})

describe('americanoTotalRounds', () => {
  it('returns n-1 for n players', () => {
    expect(americanoTotalRounds(4)).toBe(3)
    expect(americanoTotalRounds(8)).toBe(7)
    expect(americanoTotalRounds(6)).toBe(5)
  })
})

// ---------------------------------------------------------------------------
// computeStandings (round robin)
// ---------------------------------------------------------------------------

describe('computeStandings', () => {
  it('returns all players even with no completed matches', () => {
    const players = makePlayers(3)
    const standings = computeStandings([], players)
    expect(standings).toHaveLength(3)
    for (const row of standings) {
      expect(row.wins).toBe(0)
      expect(row.losses).toBe(0)
      expect(row.points).toBe(0)
    }
  })

  it('awards 2 points to winner and records loss for loser', () => {
    const players = makePlayers(2)
    const match = completedMatch({ player1_id: 'p1', player2_id: 'p2', winner_id: 'p1' })
    const standings = computeStandings([match], players)
    const p1 = standings.find(r => r.player.id === 'p1')!
    const p2 = standings.find(r => r.player.id === 'p2')!
    expect(p1.wins).toBe(1)
    expect(p1.points).toBe(2)
    expect(p2.losses).toBe(1)
    expect(p2.points).toBe(0)
  })

  it('sorts by points descending, then wins descending', () => {
    const players = makePlayers(3)
    const matches: Match[] = [
      completedMatch({ id: 'm1', player1_id: 'p1', player2_id: 'p2', winner_id: 'p1' }),
      completedMatch({ id: 'm2', player1_id: 'p2', player2_id: 'p3', winner_id: 'p2' }),
      completedMatch({ id: 'm3', player1_id: 'p1', player2_id: 'p3', winner_id: 'p1' }),
    ]
    const standings = computeStandings(matches, players)
    expect(standings[0].player.id).toBe('p1') // 2 wins = 4 pts
    expect(standings[1].player.id).toBe('p2') // 1 win = 2 pts
    expect(standings[2].player.id).toBe('p3') // 0 wins
  })

  it('ignores pending matches', () => {
    const players = makePlayers(2)
    const match: Match = { ...completedMatch({}), status: 'pending', winner_id: null }
    const standings = computeStandings([match], players)
    expect(standings[0].wins).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computeAmericanoStandings
// ---------------------------------------------------------------------------

describe('computeAmericanoStandings', () => {
  function americanoMatch(overrides: Partial<Match>): Match {
    return {
      id: 'm1',
      tournament_id: 't1',
      round: 1,
      position: 0,
      player1_id: 'p1',
      player2_id: 'p2',
      player3_id: 'p3',
      player4_id: 'p4',
      score1: 21,
      score2: 15,
      winner_id: null,
      status: 'completed',
      ...overrides,
    }
  }

  it('accumulates points per player from team scores', () => {
    const players = makePlayers(4)
    const match = americanoMatch({})
    const standings = computeAmericanoStandings([match], players)
    const p1 = standings.find(r => r.player.id === 'p1')!
    const p3 = standings.find(r => r.player.id === 'p3')!
    expect(p1.points).toBe(21) // team1 score
    expect(p3.points).toBe(15) // team2 score
  })

  it('accumulates gamesPlayed per player', () => {
    const players = makePlayers(4)
    const m1 = americanoMatch({ id: 'm1' })
    const m2 = americanoMatch({ id: 'm2', round: 2, position: 1 })
    const standings = computeAmericanoStandings([m1, m2], players)
    expect(standings.find(r => r.player.id === 'p1')!.gamesPlayed).toBe(2)
  })

  it('sorts by points descending', () => {
    const players = makePlayers(4)
    const match = americanoMatch({ score1: 21, score2: 10 })
    const standings = computeAmericanoStandings([match], players)
    expect(standings[0].points).toBeGreaterThanOrEqual(standings[1].points)
  })

  it('ignores pending matches', () => {
    const players = makePlayers(4)
    const match = americanoMatch({ status: 'pending' })
    const standings = computeAmericanoStandings([match], players)
    for (const row of standings) expect(row.points).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// computePodium
// ---------------------------------------------------------------------------

describe('computePodium', () => {
  it('single elimination: returns 1st and 2nd from final match', () => {
    const players = makePlayers(4)
    const matches: Match[] = [
      completedMatch({ id: 'm1', round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', winner_id: 'p1', score1: 21, score2: 10 }),
      completedMatch({ id: 'm2', round: 1, position: 1, player1_id: 'p3', player2_id: 'p4', winner_id: 'p3', score1: 21, score2: 15 }),
      completedMatch({ id: 'm3', round: 2, position: 0, player1_id: 'p1', player2_id: 'p3', winner_id: 'p1', score1: 21, score2: 18 }),
    ]
    const podium = computePodium('single_elimination', matches, players)
    expect(podium[0]).toEqual({ place: 1, name: 'Player 1' })
    expect(podium[1]).toEqual({ place: 2, name: 'Player 3' })
  })

  it('single elimination: returns empty array when no completed matches', () => {
    const podium = computePodium('single_elimination', [], makePlayers(4))
    expect(podium).toHaveLength(0)
  })

  it('round robin: returns top 3 places by standings', () => {
    const players = makePlayers(4)
    const matches: Match[] = [
      completedMatch({ id: 'm1', player1_id: 'p1', player2_id: 'p2', winner_id: 'p1' }),
      completedMatch({ id: 'm2', player1_id: 'p1', player2_id: 'p3', winner_id: 'p1' }),
      completedMatch({ id: 'm3', player1_id: 'p1', player2_id: 'p4', winner_id: 'p1' }),
      completedMatch({ id: 'm4', player1_id: 'p2', player2_id: 'p3', winner_id: 'p2' }),
      completedMatch({ id: 'm5', player1_id: 'p2', player2_id: 'p4', winner_id: 'p2' }),
      completedMatch({ id: 'm6', player1_id: 'p3', player2_id: 'p4', winner_id: 'p3' }),
    ]
    const podium = computePodium('round_robin', matches, players)
    expect(podium).toHaveLength(3)
    expect(podium[0].place).toBe(1)
    expect(podium[0].name).toBe('Player 1')
    expect(podium[1].name).toBe('Player 2')
    expect(podium[2].name).toBe('Player 3')
  })

  it('americano: returns top 3 places by points', () => {
    const players = makePlayers(4)
    const match: Match = {
      id: 'm1', tournament_id: 't1', round: 1, position: 0,
      player1_id: 'p1', player2_id: 'p2', player3_id: 'p3', player4_id: 'p4',
      score1: 21, score2: 5, winner_id: null, status: 'completed',
    }
    const podium = computePodium('americano', [match], players)
    expect(podium.length).toBeGreaterThanOrEqual(2)
    expect(podium[0].place).toBe(1)
  })
})

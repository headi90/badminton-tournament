import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPlayers, addPlayer, removePlayer,
  getTournaments, getTournament, addTournament, updateTournament, removeTournament,
  getTournamentPlayers, addTournamentPlayer, removeTournamentPlayer,
  getMatches, insertMatches, updateMatch, advanceSingleElimWinner,
  getPlayerMatchHistory,
} from './db'

// In-memory localStorage stub
const store: Record<string, string> = {}
globalThis.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  key: () => null,
  length: 0,
}
globalThis.crypto = { randomUUID: () => Math.random().toString(36).slice(2) as unknown as `${string}-${string}-${string}-${string}-${string}` }

beforeEach(() => localStorage.clear())

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

describe('players', () => {
  it('starts empty', () => {
    expect(getPlayers()).toHaveLength(0)
  })

  it('addPlayer stores and returns the player', () => {
    const p = addPlayer('Alice')
    expect(p.name).toBe('Alice')
    expect(getPlayers()).toHaveLength(1)
  })

  it('getPlayers returns players sorted by created_at ascending', () => {
    addPlayer('B')
    addPlayer('A')
    const names = getPlayers().map(p => p.name)
    expect(names[0]).toBe('B') // first added comes first
  })

  it('removePlayer deletes by id', () => {
    const p = addPlayer('Alice')
    removePlayer(p.id)
    expect(getPlayers()).toHaveLength(0)
  })

  it('removePlayer leaves other players intact', () => {
    const p1 = addPlayer('Alice')
    addPlayer('Bob')
    removePlayer(p1.id)
    const remaining = getPlayers()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('Bob')
  })
})

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

describe('tournaments', () => {
  it('addTournament creates with status setup', () => {
    const t = addTournament('Spring Cup', 'round_robin')
    expect(t.name).toBe('Spring Cup')
    expect(t.format).toBe('round_robin')
    expect(t.status).toBe('setup')
  })

  it('getTournament finds by id', () => {
    const t = addTournament('Cup', 'single_elimination')
    expect(getTournament(t.id)).toBeDefined()
  })

  it('getTournament returns undefined for unknown id', () => {
    expect(getTournament('missing')).toBeUndefined()
  })

  it('getTournaments sorts newest first', () => {
    // Write tournaments with explicit created_at so ordering is deterministic
    const older = { id: 'old1', name: 'First', format: 'round_robin' as const, status: 'setup' as const, created_at: '2024-01-01T00:00:00.000Z' }
    const newer = { id: 'new1', name: 'Second', format: 'round_robin' as const, status: 'setup' as const, created_at: '2024-06-01T00:00:00.000Z' }
    localStorage.setItem('bt_tournaments', JSON.stringify([older, newer]))
    const list = getTournaments()
    expect(list[0].id).toBe('new1')
    expect(list[1].id).toBe('old1')
  })

  it('addTournament stores optional date and location', () => {
    const t = addTournament('Cup', 'round_robin', '2026-05-01', 'Sports Hall')
    expect(getTournament(t.id)?.date).toBe('2026-05-01')
    expect(getTournament(t.id)?.location).toBe('Sports Hall')
  })

  it('addTournament works without date and location', () => {
    const t = addTournament('Cup', 'round_robin')
    expect(getTournament(t.id)?.date).toBeUndefined()
    expect(getTournament(t.id)?.location).toBeUndefined()
  })

  it('updateTournament patches fields', () => {
    const t = addTournament('Cup', 'round_robin')
    updateTournament(t.id, { status: 'active' })
    expect(getTournament(t.id)?.status).toBe('active')
  })

  it('removeTournament deletes tournament and cascades to players and matches', () => {
    const t = addTournament('Cup', 'round_robin')
    const p = addPlayer('Alice')
    addTournamentPlayer(t.id, p.id, 1)
    insertMatches([{
      tournament_id: t.id, round: 1, position: 0,
      player1_id: p.id, player2_id: null,
      score1: null, score2: null, winner_id: null, status: 'pending',
    }])
    removeTournament(t.id)
    expect(getTournament(t.id)).toBeUndefined()
    expect(getTournamentPlayers(t.id)).toHaveLength(0)
    expect(getMatches(t.id)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Tournament players
// ---------------------------------------------------------------------------

describe('tournament players', () => {
  it('addTournamentPlayer links player to tournament', () => {
    const t = addTournament('Cup', 'round_robin')
    const p = addPlayer('Alice')
    addTournamentPlayer(t.id, p.id, 1)
    const tps = getTournamentPlayers(t.id)
    expect(tps).toHaveLength(1)
    expect(tps[0].player.name).toBe('Alice')
  })

  it('getTournamentPlayers sorts by seed', () => {
    const t = addTournament('Cup', 'round_robin')
    const p1 = addPlayer('A')
    const p2 = addPlayer('B')
    addTournamentPlayer(t.id, p2.id, 2)
    addTournamentPlayer(t.id, p1.id, 1)
    const tps = getTournamentPlayers(t.id)
    expect(tps[0].player.id).toBe(p1.id)
  })

  it('removeTournamentPlayer unlinks only the target player', () => {
    const t = addTournament('Cup', 'round_robin')
    const p1 = addPlayer('A')
    const p2 = addPlayer('B')
    addTournamentPlayer(t.id, p1.id, 1)
    addTournamentPlayer(t.id, p2.id, 2)
    removeTournamentPlayer(t.id, p1.id)
    const remaining = getTournamentPlayers(t.id)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].player.id).toBe(p2.id)
  })

  it('does not return tournament players whose player was deleted', () => {
    const t = addTournament('Cup', 'round_robin')
    const p = addPlayer('Ghost')
    addTournamentPlayer(t.id, p.id, 1)
    removePlayer(p.id)
    expect(getTournamentPlayers(t.id)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

describe('matches', () => {
  it('insertMatches stores matches with generated ids', () => {
    const t = addTournament('Cup', 'round_robin')
    insertMatches([{
      tournament_id: t.id, round: 1, position: 0,
      player1_id: 'p1', player2_id: 'p2',
      score1: null, score2: null, winner_id: null, status: 'pending',
    }])
    const matches = getMatches(t.id)
    expect(matches).toHaveLength(1)
    expect(matches[0].id).toBeDefined()
  })

  it('getMatches sorts by round then position', () => {
    const t = addTournament('Cup', 'single_elimination')
    insertMatches([
      { tournament_id: t.id, round: 2, position: 0, player1_id: null, player2_id: null, score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 1, position: 1, player1_id: 'p3', player2_id: 'p4', score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    const matches = getMatches(t.id)
    expect(matches[0].round).toBe(1)
    expect(matches[0].position).toBe(0)
    expect(matches[1].position).toBe(1)
    expect(matches[2].round).toBe(2)
  })

  it('updateMatch patches only the target match', () => {
    const t = addTournament('Cup', 'round_robin')
    insertMatches([
      { tournament_id: t.id, round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 1, position: 1, player1_id: 'p3', player2_id: 'p4', score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    const [m1, m2] = getMatches(t.id)
    updateMatch(m1.id, { score1: 21, score2: 15, winner_id: 'p1', status: 'completed' })
    const updated = getMatches(t.id)
    expect(updated.find(m => m.id === m1.id)?.status).toBe('completed')
    expect(updated.find(m => m.id === m2.id)?.status).toBe('pending')
  })

  it('getMatches resolves player objects from bt_players', () => {
    const t = addTournament('Cup', 'round_robin')
    const p = addPlayer('Alice')
    insertMatches([{
      tournament_id: t.id, round: 1, position: 0,
      player1_id: p.id, player2_id: null,
      score1: null, score2: null, winner_id: null, status: 'pending',
    }])
    const matches = getMatches(t.id)
    expect(matches[0].player1?.name).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// advanceSingleElimWinner
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// getPlayerMatchHistory
// ---------------------------------------------------------------------------

describe('getPlayerMatchHistory', () => {
  it('returns only matches the player participated in', () => {
    const t = addTournament('Cup', 'round_robin')
    const p1 = addPlayer('Alice')
    const p2 = addPlayer('Bob')
    const p3 = addPlayer('Carol')
    insertMatches([
      { tournament_id: t.id, round: 1, position: 0, player1_id: p1.id, player2_id: p2.id, score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 1, position: 1, player1_id: p2.id, player2_id: p3.id, score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    expect(getPlayerMatchHistory(p1.id)).toHaveLength(1)
    expect(getPlayerMatchHistory(p2.id)).toHaveLength(2)
    expect(getPlayerMatchHistory(p3.id)).toHaveLength(1)
  })

  it('includes tournament name on each match', () => {
    const t = addTournament('Spring Cup', 'round_robin')
    const p = addPlayer('Alice')
    insertMatches([{ tournament_id: t.id, round: 1, position: 0, player1_id: p.id, player2_id: null, score1: null, score2: null, winner_id: null, status: 'pending' }])
    const history = getPlayerMatchHistory(p.id)
    expect(history[0].tournamentName).toBe('Spring Cup')
  })

  it('includes americano matches where player is on team 2', () => {
    const t = addTournament('Cup', 'americano')
    const p1 = addPlayer('A'); const p2 = addPlayer('B')
    const p3 = addPlayer('C'); const p4 = addPlayer('D')
    insertMatches([{ tournament_id: t.id, round: 1, position: 0, player1_id: p1.id, player2_id: p2.id, player3_id: p3.id, player4_id: p4.id, score1: null, score2: null, winner_id: null, status: 'pending' }])
    expect(getPlayerMatchHistory(p3.id)).toHaveLength(1)
    expect(getPlayerMatchHistory(p4.id)).toHaveLength(1)
  })

  it('returns empty array for a player with no matches', () => {
    const p = addPlayer('Ghost')
    expect(getPlayerMatchHistory(p.id)).toHaveLength(0)
  })
})

describe('advanceSingleElimWinner', () => {
  it('puts the winner into the correct slot of the next round match', () => {
    const t = addTournament('Cup', 'single_elimination')
    insertMatches([
      { tournament_id: t.id, round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', score1: 21, score2: 10, winner_id: 'p1', status: 'completed' },
      { tournament_id: t.id, round: 1, position: 1, player1_id: 'p3', player2_id: 'p4', score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 2, position: 0, player1_id: null, player2_id: null, score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    const [m1, , m3] = getMatches(t.id)
    advanceSingleElimWinner(m1, getMatches(t.id))
    const nextMatch = getMatches(t.id).find(m => m.id === m3.id)!
    // position 0 is even → player1 slot
    expect(nextMatch.player1_id).toBe('p1')
  })

  it('puts second-position winner into player2 slot', () => {
    const t = addTournament('Cup', 'single_elimination')
    insertMatches([
      { tournament_id: t.id, round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 1, position: 1, player1_id: 'p3', player2_id: 'p4', score1: 21, score2: 10, winner_id: 'p3', status: 'completed' },
      { tournament_id: t.id, round: 2, position: 0, player1_id: null, player2_id: null, score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    const [, m2] = getMatches(t.id)
    advanceSingleElimWinner(m2, getMatches(t.id))
    const final = getMatches(t.id).find(m => m.round === 2)!
    // position 1 is odd → player2 slot
    expect(final.player2_id).toBe('p3')
  })

  it('does nothing when match has no winner', () => {
    const t = addTournament('Cup', 'single_elimination')
    insertMatches([
      { tournament_id: t.id, round: 1, position: 0, player1_id: 'p1', player2_id: 'p2', score1: null, score2: null, winner_id: null, status: 'pending' },
      { tournament_id: t.id, round: 2, position: 0, player1_id: null, player2_id: null, score1: null, score2: null, winner_id: null, status: 'pending' },
    ])
    const [m1] = getMatches(t.id)
    advanceSingleElimWinner(m1, getMatches(t.id))
    const final = getMatches(t.id).find(m => m.round === 2)!
    expect(final.player1_id).toBeNull()
  })
})

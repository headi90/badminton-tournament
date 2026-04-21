import type { Player, Tournament, TournamentFormat, Match, TournamentPlayer } from './types'

function uid(): string {
  return crypto.randomUUID()
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// --- Players ---

export async function getPlayers(): Promise<Player[]> {
  return load<Player>('bt_players').sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function addPlayer(name: string): Promise<Player> {
  const players = load<Player>('bt_players')
  const player: Player = { id: uid(), name, created_at: new Date().toISOString() }
  save('bt_players', [...players, player])
  return player
}

export async function removePlayer(id: string): Promise<void> {
  save('bt_players', load<Player>('bt_players').filter(p => p.id !== id))
}

export async function getPlayerMatchHistory(playerId: string): Promise<(Match & { tournamentName: string })[]> {
  const allMatches = load<Match>('bt_matches')
  const tournaments = load<Tournament>('bt_tournaments')
  const players = load<Player>('bt_players')
  return allMatches
    .filter(m =>
      m.player1_id === playerId || m.player2_id === playerId ||
      m.player3_id === playerId || m.player4_id === playerId
    )
    .map(m => ({
      ...m,
      player1: players.find(p => p.id === m.player1_id),
      player2: players.find(p => p.id === m.player2_id),
      player3: players.find(p => p.id === m.player3_id),
      player4: players.find(p => p.id === m.player4_id),
      tournamentName: tournaments.find(t => t.id === m.tournament_id)?.name ?? '—',
    }))
    .sort((a, b) => a.tournament_id.localeCompare(b.tournament_id) || a.round - b.round || a.position - b.position)
}

// --- Tournaments ---

export async function getTournaments(): Promise<Tournament[]> {
  return load<Tournament>('bt_tournaments').sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getTournament(id: string): Promise<Tournament | null> {
  return load<Tournament>('bt_tournaments').find(t => t.id === id) ?? null
}

export async function addTournament(name: string, format: TournamentFormat, date?: string, location?: string): Promise<Tournament> {
  const tournaments = load<Tournament>('bt_tournaments')
  const t: Tournament = { id: uid(), name, format, status: 'setup', created_at: new Date().toISOString(), date: date || undefined, location: location || undefined }
  save('bt_tournaments', [...tournaments, t])
  return t
}

export async function updateTournament(id: string, patch: Partial<Tournament>): Promise<void> {
  save('bt_tournaments', load<Tournament>('bt_tournaments').map(t => t.id === id ? { ...t, ...patch } : t))
}

export async function removeTournament(id: string): Promise<void> {
  save('bt_tournaments', load<Tournament>('bt_tournaments').filter(t => t.id !== id))
  save('bt_tournament_players', load<TournamentPlayer>('bt_tournament_players').filter(tp => tp.tournament_id !== id))
  save('bt_matches', load<Match>('bt_matches').filter(m => m.tournament_id !== id))
}

// --- Tournament Players ---

export async function getTournamentPlayers(tournamentId: string): Promise<(TournamentPlayer & { player: Player })[]> {
  const all = load<TournamentPlayer>('bt_tournament_players').filter(tp => tp.tournament_id === tournamentId)
  const players = load<Player>('bt_players')
  return all
    .sort((a, b) => a.seed - b.seed)
    .map(tp => ({ ...tp, player: players.find(p => p.id === tp.player_id) }))
    .filter((tp): tp is TournamentPlayer & { player: Player } => tp.player !== undefined)
}

export async function addTournamentPlayer(tournamentId: string, playerId: string, seed: number): Promise<void> {
  const all = load<TournamentPlayer>('bt_tournament_players')
  const entry: TournamentPlayer = { id: uid(), tournament_id: tournamentId, player_id: playerId, seed }
  save('bt_tournament_players', [...all, entry])
}

export async function removeTournamentPlayer(tournamentId: string, playerId: string): Promise<void> {
  save(
    'bt_tournament_players',
    load<TournamentPlayer>('bt_tournament_players').filter(
      tp => !(tp.tournament_id === tournamentId && tp.player_id === playerId)
    )
  )
}

// --- Matches ---

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const matches = load<Match>('bt_matches').filter(m => m.tournament_id === tournamentId)
  const players = load<Player>('bt_players')
  return matches
    .sort((a, b) => a.round - b.round || a.position - b.position)
    .map(m => ({
      ...m,
      player1: players.find(p => p.id === m.player1_id),
      player2: players.find(p => p.id === m.player2_id),
      player3: players.find(p => p.id === m.player3_id),
      player4: players.find(p => p.id === m.player4_id),
    }))
}

export async function insertMatches(matches: Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[]): Promise<void> {
  const all = load<Match>('bt_matches')
  const newMatches = matches.map(m => ({ ...m, id: uid() }))
  save('bt_matches', [...all, ...newMatches])
}

export async function updateMatch(id: string, patch: Partial<Match>): Promise<void> {
  save('bt_matches', load<Match>('bt_matches').map(m => m.id === id ? { ...m, ...patch } : m))
}

export async function resetMatch(matchId: string): Promise<void> {
  save('bt_matches', load<Match>('bt_matches').map(m =>
    m.id === matchId
      ? { ...m, score1: null, score2: null, winner_id: null, status: 'pending' }
      : m
  ))
}

export async function undoSingleElimAdvance(match: Match): Promise<void> {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'
  const all = load<Match>('bt_matches')
  const nextMatch = all.find(m =>
    m.tournament_id === match.tournament_id &&
    m.round === nextRound &&
    m.position === nextPos
  )
  if (!nextMatch) return
  await updateMatch(nextMatch.id, { [slot]: null })
}

export function canUndoSingleElim(match: Match, allMatches: Match[]): boolean {
  if (match.status !== 'completed') return false
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const nextMatch = allMatches.find(m => m.round === nextRound && m.position === nextPos)
  return !nextMatch || nextMatch.status === 'pending'
}

export async function advanceSingleElimWinner(match: Match, allMatches: Match[]): Promise<void> {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const nextMatch = allMatches.find(m => m.round === nextRound && m.position === nextPos)
  if (!nextMatch) return
  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'
  await updateMatch(nextMatch.id, { [slot]: match.winner_id })
}

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

export function getPlayers(): Player[] {
  return load<Player>('bt_players').sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  )
}

export function addPlayer(name: string): Player {
  const players = load<Player>('bt_players')
  const player: Player = { id: uid(), name, created_at: new Date().toISOString() }
  save('bt_players', [...players, player])
  return player
}

export function removePlayer(id: string): void {
  save('bt_players', load<Player>('bt_players').filter(p => p.id !== id))
}

export function getPlayerMatchHistory(playerId: string): (Match & { tournamentName: string })[] {
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

export function getTournaments(): Tournament[] {
  return load<Tournament>('bt_tournaments').sort(
    (a, b) => b.created_at.localeCompare(a.created_at)
  )
}

export function getTournament(id: string): Tournament | undefined {
  return load<Tournament>('bt_tournaments').find(t => t.id === id)
}

export function addTournament(name: string, format: TournamentFormat): Tournament {
  const tournaments = load<Tournament>('bt_tournaments')
  const t: Tournament = { id: uid(), name, format, status: 'setup', created_at: new Date().toISOString() }
  save('bt_tournaments', [...tournaments, t])
  return t
}

export function updateTournament(id: string, patch: Partial<Tournament>): void {
  save('bt_tournaments', load<Tournament>('bt_tournaments').map(t => t.id === id ? { ...t, ...patch } : t))
}

export function removeTournament(id: string): void {
  save('bt_tournaments', load<Tournament>('bt_tournaments').filter(t => t.id !== id))
  save('bt_tournament_players', load<TournamentPlayer>('bt_tournament_players').filter(tp => tp.tournament_id !== id))
  save('bt_matches', load<Match>('bt_matches').filter(m => m.tournament_id !== id))
}

// --- Tournament Players ---

export function getTournamentPlayers(tournamentId: string): (TournamentPlayer & { player: Player })[] {
  const all = load<TournamentPlayer>('bt_tournament_players').filter(tp => tp.tournament_id === tournamentId)
  const players = load<Player>('bt_players')
  return all
    .sort((a, b) => a.seed - b.seed)
    .map(tp => ({ ...tp, player: players.find(p => p.id === tp.player_id) }))
    .filter((tp): tp is TournamentPlayer & { player: Player } => tp.player !== undefined)
}

export function addTournamentPlayer(tournamentId: string, playerId: string, seed: number): void {
  const all = load<TournamentPlayer>('bt_tournament_players')
  const entry: TournamentPlayer = { id: uid(), tournament_id: tournamentId, player_id: playerId, seed }
  save('bt_tournament_players', [...all, entry])
}

export function removeTournamentPlayer(tournamentId: string, playerId: string): void {
  save(
    'bt_tournament_players',
    load<TournamentPlayer>('bt_tournament_players').filter(
      tp => !(tp.tournament_id === tournamentId && tp.player_id === playerId)
    )
  )
}

// --- Matches ---

export function getMatches(tournamentId: string): Match[] {
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

export function insertMatches(matches: Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[]): void {
  const all = load<Match>('bt_matches')
  const newMatches = matches.map(m => ({ ...m, id: uid() }))
  save('bt_matches', [...all, ...newMatches])
}

export function updateMatch(id: string, patch: Partial<Match>): void {
  save('bt_matches', load<Match>('bt_matches').map(m => m.id === id ? { ...m, ...patch } : m))
}

export function advanceSingleElimWinner(match: Match, allMatches: Match[]): void {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const nextMatch = allMatches.find(m => m.round === nextRound && m.position === nextPos)
  if (!nextMatch) return
  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'
  updateMatch(nextMatch.id, { [slot]: match.winner_id })
}

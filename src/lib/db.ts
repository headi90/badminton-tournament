import { supabase } from './supabase'
import type { Player, Tournament, TournamentFormat, Match, TournamentPlayer } from './types'

// --- Players ---

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addPlayer(name: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}

export async function getPlayerMatchHistory(playerId: string): Promise<(Match & { tournamentName: string })[]> {
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .or(`player1_id.eq.${playerId},player2_id.eq.${playerId},player3_id.eq.${playerId},player4_id.eq.${playerId}`)
    .order('tournament_id')
    .order('round')
    .order('position')
  if (matchError) throw matchError

  const tournamentIds = [...new Set(matches.map(m => m.tournament_id))]
  const playerIds = [...new Set(matches.flatMap(m =>
    [m.player1_id, m.player2_id, m.player3_id, m.player4_id].filter(Boolean)
  ))]

  const [{ data: tournaments, error: tError }, { data: players, error: pError }] = await Promise.all([
    supabase.from('tournaments').select('id, name').in('id', tournamentIds),
    supabase.from('players').select('*').in('id', playerIds),
  ])
  if (tError) throw tError
  if (pError) throw pError

  return matches.map(m => ({
    ...m,
    player1: players!.find(p => p.id === m.player1_id),
    player2: players!.find(p => p.id === m.player2_id),
    player3: players!.find(p => p.id === m.player3_id),
    player4: players!.find(p => p.id === m.player4_id),
    tournamentName: tournaments!.find(t => t.id === m.tournament_id)?.name ?? '—',
  }))
}

// --- Tournaments ---

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function addTournament(name: string, format: TournamentFormat, date?: string, location?: string): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ name, format, status: 'setup', date: date || null, location: location || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTournament(id: string, patch: Partial<Tournament>): Promise<void> {
  const { error } = await supabase.from('tournaments').update(patch).eq('id', id)
  if (error) throw error
}

export async function removeTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').delete().eq('id', id)
  if (error) throw error
}

// --- Tournament Players ---

export async function getTournamentPlayers(tournamentId: string): Promise<(TournamentPlayer & { player: Player })[]> {
  const { data, error } = await supabase
    .from('tournament_players')
    .select('*, player:players(*)')
    .eq('tournament_id', tournamentId)
    .order('seed', { ascending: true })
  if (error) throw error
  return data.filter((tp): tp is TournamentPlayer & { player: Player } => tp.player !== null)
}

export async function addTournamentPlayer(tournamentId: string, playerId: string, seed: number): Promise<void> {
  const { error } = await supabase
    .from('tournament_players')
    .insert({ tournament_id: tournamentId, player_id: playerId, seed })
  if (error) throw error
}

export async function removeTournamentPlayer(tournamentId: string, playerId: string): Promise<void> {
  const { error } = await supabase
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerId)
  if (error) throw error
}

// --- Matches ---

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round')
    .order('position')
  if (matchError) throw matchError

  const playerIds = [...new Set(matches.flatMap(m =>
    [m.player1_id, m.player2_id, m.player3_id, m.player4_id].filter(Boolean)
  ))]

  if (playerIds.length === 0) return matches

  const { data: players, error: pError } = await supabase
    .from('players')
    .select('*')
    .in('id', playerIds)
  if (pError) throw pError

  return matches.map(m => ({
    ...m,
    player1: players.find(p => p.id === m.player1_id),
    player2: players.find(p => p.id === m.player2_id),
    player3: players.find(p => p.id === m.player3_id),
    player4: players.find(p => p.id === m.player4_id),
  }))
}

export async function insertMatches(matches: Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[]): Promise<void> {
  const { error } = await supabase.from('matches').insert(matches)
  if (error) throw error
}

export async function updateMatch(id: string, patch: Partial<Match>): Promise<void> {
  const { error } = await supabase.from('matches').update(patch).eq('id', id)
  if (error) throw error
}

export async function resetMatch(matchId: string): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ score1: null, score2: null, winner_id: null, status: 'pending' })
    .eq('id', matchId)
  if (error) throw error
}

export async function undoSingleElimAdvance(match: Match): Promise<void> {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'

  const { data: nextMatch, error } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', match.tournament_id)
    .eq('round', nextRound)
    .eq('position', nextPos)
    .single()
  if (error || !nextMatch) return
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

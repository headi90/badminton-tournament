import type { Player, Tournament, TournamentFormat, Match, TournamentPlayer } from './types'
import { supabase } from './supabase'

// --- Players ---

export async function getPlayers(): Promise<Player[]> {
  const { data } = await supabase.from('players').select('*').order('created_at')
  return (data as Player[]) ?? []
}

export async function addPlayer(name: string): Promise<Player> {
  const { data, error } = await supabase.from('players').insert({ name }).select().single()
  if (error || !data) throw error ?? new Error('addPlayer returned no data')
  return data as Player
}

export async function removePlayer(id: string): Promise<void> {
  await supabase.from('players').delete().eq('id', id)
}

export async function getPlayerMatchHistory(playerId: string): Promise<(Match & { tournamentName: string })[]> {
  const [{ data: matches }, { data: players }, { data: tournaments }] = await Promise.all([
    supabase.from('matches').select('*').or(
      `player1_id.eq.${playerId},player2_id.eq.${playerId},player3_id.eq.${playerId},player4_id.eq.${playerId}`
    ),
    supabase.from('players').select('*'),
    supabase.from('tournaments').select('*'),
  ])
  if (!matches || !players || !tournaments) return []
  const pm = new Map((players as Player[]).map(p => [p.id, p]))
  const tm = new Map((tournaments as Tournament[]).map(t => [t.id, t]))
  return (matches as Match[])
    .sort((a, b) => a.tournament_id.localeCompare(b.tournament_id) || a.round - b.round || a.position - b.position)
    .map(m => ({
      ...m,
      player1: m.player1_id ? pm.get(m.player1_id) : undefined,
      player2: m.player2_id ? pm.get(m.player2_id) : undefined,
      player3: m.player3_id ? pm.get(m.player3_id) : undefined,
      player4: m.player4_id ? pm.get(m.player4_id) : undefined,
      tournamentName: tm.get(m.tournament_id)?.name ?? '—',
    }))
}

// --- Tournaments ---

export async function getTournaments(): Promise<Tournament[]> {
  const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false })
  return (data as Tournament[]) ?? []
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
  return (data as Tournament | null) ?? null
}

export async function addTournament(name: string, format: TournamentFormat, date?: string, location?: string): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .insert({ name, format, status: 'setup', date: date || null, location: location || null })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('addTournament returned no data')
  return data as Tournament
}

export async function updateTournament(id: string, patch: Partial<Tournament>): Promise<void> {
  await supabase.from('tournaments').update(patch).eq('id', id)
}

export async function removeTournament(id: string): Promise<void> {
  await supabase.from('tournaments').delete().eq('id', id)
}

// --- Tournament Players ---

export async function getTournamentPlayers(tournamentId: string): Promise<(TournamentPlayer & { player: Player })[]> {
  const [{ data: tps }, { data: players }] = await Promise.all([
    supabase.from('tournament_players').select('*').eq('tournament_id', tournamentId).order('seed'),
    supabase.from('players').select('*'),
  ])
  if (!tps || !players) return []
  const pm = new Map((players as Player[]).map(p => [p.id, p]))
  return (tps as TournamentPlayer[])
    .map(tp => ({ ...tp, player: pm.get(tp.player_id) }))
    .filter((tp): tp is TournamentPlayer & { player: Player } => tp.player !== undefined)
}

export async function addTournamentPlayer(tournamentId: string, playerId: string, seed: number): Promise<void> {
  await supabase.from('tournament_players').insert({ tournament_id: tournamentId, player_id: playerId, seed })
}

export async function removeTournamentPlayer(tournamentId: string, playerId: string): Promise<void> {
  await supabase.from('tournament_players').delete()
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerId)
}

// --- Matches ---

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const [{ data: matches }, { data: players }] = await Promise.all([
    supabase.from('matches').select('*').eq('tournament_id', tournamentId).order('round').order('position'),
    supabase.from('players').select('*'),
  ])
  if (!matches || !players) return []
  const pm = new Map((players as Player[]).map(p => [p.id, p]))
  return (matches as Match[]).map(m => ({
    ...m,
    player1: m.player1_id ? pm.get(m.player1_id) : undefined,
    player2: m.player2_id ? pm.get(m.player2_id) : undefined,
    player3: m.player3_id ? pm.get(m.player3_id) : undefined,
    player4: m.player4_id ? pm.get(m.player4_id) : undefined,
  }))
}

export async function insertMatches(matches: Omit<Match, 'id' | 'player1' | 'player2' | 'player3' | 'player4'>[]): Promise<void> {
  const rows = matches.map(m => ({ ...m, id: crypto.randomUUID() }))
  await supabase.from('matches').insert(rows)
}

export async function updateMatch(id: string, patch: Partial<Match>): Promise<void> {
  const { player1, player2, player3, player4, ...rest } = patch
  void player1; void player2; void player3; void player4
  await supabase.from('matches').update(rest).eq('id', id)
}

export async function resetMatch(matchId: string): Promise<void> {
  await supabase.from('matches').update({ score1: null, score2: null, winner_id: null, status: 'pending' }).eq('id', matchId)
}

export async function undoSingleElimAdvance(match: Match): Promise<void> {
  if (!match.winner_id) return
  const nextRound = match.round + 1
  const nextPos = Math.floor(match.position / 2)
  const slot = match.position % 2 === 0 ? 'player1_id' : 'player2_id'
  const { data } = await supabase.from('matches').select('*')
    .eq('tournament_id', match.tournament_id)
    .eq('round', nextRound)
    .eq('position', nextPos)
    .maybeSingle()
  if (!data) return
  await updateMatch((data as Match).id, { [slot]: null })
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

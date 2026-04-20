export type TournamentFormat = 'single_elimination' | 'round_robin' | 'americano'
export type TournamentStatus = 'setup' | 'active' | 'finished'
export type MatchStatus = 'pending' | 'completed'

export interface Player {
  id: string
  name: string
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  format: TournamentFormat
  status: TournamentStatus
  created_at: string
}

export interface TournamentPlayer {
  id: string
  tournament_id: string
  player_id: string
  seed: number
  player?: Player
}

export interface Match {
  id: string
  tournament_id: string
  round: number
  position: number
  player1_id: string | null
  player2_id: string | null
  player3_id?: string | null  // americano team 2
  player4_id?: string | null  // americano team 2
  score1: number | null
  score2: number | null
  winner_id: string | null
  status: MatchStatus
  player1?: Player
  player2?: Player
  player3?: Player  // americano
  player4?: Player  // americano
}

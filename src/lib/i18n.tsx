import { createContext, useContext, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'pl'

export const translations = {
  en: {
    // Nav
    nav_home: '🏸 Badminton',
    nav_players: 'Players',
    nav_tournaments: 'Tournaments',

    // Welcome
    welcome_title: 'Badminton Tournament',
    welcome_subtitle: 'Organise single-elimination, round-robin or Americano tournaments for your group.',
    welcome_tournaments_title: 'Tournaments',
    welcome_tournaments_desc: 'Create and manage brackets, round-robin or Americano group stages.',
    welcome_players_title: 'Players',
    welcome_players_desc: 'Keep a roster of players ready to enter any tournament.',

    // Tournaments page
    tournaments_heading: 'Tournaments',
    tournaments_new: 'New Tournament',
    tournaments_name_placeholder: 'Tournament name',
    tournaments_format_single: 'Single Elimination',
    tournaments_format_rr: 'Round Robin',
    tournaments_format_americano: 'Americano',
    tournaments_create: 'Create',
    tournaments_empty: 'No tournaments yet.',

    // Tournament card / status
    status_setup: 'setup',
    status_active: 'active',
    status_finished: 'finished',

    // Tournament detail
    detail_back: '← Tournaments',
    detail_mark_finished: 'Mark Finished',
    detail_participants: 'Participants',
    detail_add_player: 'Add player:',
    detail_add_all: '+ Add all',
    detail_remove_all: '− Remove all',
    detail_no_players: 'No players found. Add some in the Players page first.',
    detail_start: 'Start Tournament',
    detail_not_found: 'Not found.',
    detail_need_players: 'Need at least 2 players.',
    detail_need_players_americano: 'Need at least 4 players for Americano.',
    detail_americano_remainder: 'Note: with this player count, some players will sit out each round.',

    // Players page
    players_heading: 'Players',
    players_placeholder: 'Player name',
    players_add: 'Add',
    players_empty: 'No players yet.',
    players_remove: 'Remove',
    players_remove_confirm: 'Remove this player?',
    players_remove_all_confirm: 'Remove all players?',
    players_duplicate: 'A player with this name already exists.',

    // Bracket
    bracket_round: 'Round',

    // RoundRobin
    rr_standings: 'Standings',
    rr_schedule: 'Schedule',
    rr_col_player: 'Player',
    rr_col_wins: 'W',
    rr_col_losses: 'L',
    rr_col_pts: 'Pts',

    // Americano
    americano_standings: 'Standings',
    americano_schedule: 'Schedule',
    americano_col_player: 'Player',
    americano_col_games: 'G',
    americano_col_points: 'Pts',
    americano_round: 'Round',

    // Tournament card
    tournament_remove: 'Delete',
    tournament_remove_confirm: 'Delete this tournament and all its matches?',

    // Podium modal
    podium_title: 'Tournament Finished!',
    podium_congrats: 'Congratulations to all players!',
    podium_1st: '1st Place',
    podium_2nd: '2nd Place',
    podium_3rd: '3rd Place',
    podium_close: 'Close',

    // Match modal
    match_title: 'Enter Match Result',
    match_tied: 'Scores must not be equal.',
    match_cancel: 'Cancel',
    match_save: 'Save',
  },
  pl: {
    nav_home: '🏸 Badminton',
    nav_players: 'Gracze',
    nav_tournaments: 'Turnieje',

    welcome_title: 'Turniej Badmintona',
    welcome_subtitle: 'Organizuj turnieje single elimination, round robin lub Americano dla swojej grupy.',
    welcome_tournaments_title: 'Turnieje',
    welcome_tournaments_desc: 'Twórz drabinki, rozgrywki round robin lub Americano oraz nimi zarządzaj.',
    welcome_players_title: 'Gracze',
    welcome_players_desc: 'Prowadź listę graczy gotowych do udziału w dowolnym turnieju.',

    tournaments_heading: 'Turnieje',
    tournaments_new: 'Nowy turniej',
    tournaments_name_placeholder: 'Nazwa turnieju',
    tournaments_format_single: 'Single Elimination',
    tournaments_format_rr: 'Round Robin',
    tournaments_format_americano: 'Americano',
    tournaments_create: 'Utwórz',
    tournaments_empty: 'Brak turniejów.',

    status_setup: 'konfiguracja',
    status_active: 'aktywny',
    status_finished: 'zakończony',

    detail_back: '← Turnieje',
    detail_mark_finished: 'Zakończ turniej',
    detail_participants: 'Uczestnicy',
    detail_add_player: 'Dodaj gracza:',
    detail_add_all: '+ Dodaj wszystkich',
    detail_remove_all: '− Usuń wszystkich',
    detail_no_players: 'Brak graczy. Najpierw dodaj ich na stronie Graczy.',
    detail_start: 'Rozpocznij turniej',
    detail_not_found: 'Nie znaleziono.',
    detail_need_players: 'Potrzeba co najmniej 2 graczy.',
    detail_need_players_americano: 'Potrzeba co najmniej 4 graczy do Americano.',
    detail_americano_remainder: 'Uwaga: przy tej liczbie graczy, niektórzy będą mieć przerwę w każdej rundzie.',

    players_heading: 'Gracze',
    players_placeholder: 'Imię gracza',
    players_add: 'Dodaj',
    players_empty: 'Brak graczy.',
    players_remove: 'Usuń',
    players_remove_confirm: 'Usunąć tego gracza?',
    players_remove_all_confirm: 'Usunąć wszystkich graczy?',
    players_duplicate: 'Gracz o tej nazwie już istnieje.',

    bracket_round: 'Runda',

    rr_standings: 'Tabela',
    rr_schedule: 'Harmonogram',
    rr_col_player: 'Gracz',
    rr_col_wins: 'W',
    rr_col_losses: 'P',
    rr_col_pts: 'Pkt',

    americano_standings: 'Tabela',
    americano_schedule: 'Harmonogram',
    americano_col_player: 'Gracz',
    americano_col_games: 'M',
    americano_col_points: 'Pkt',
    americano_round: 'Runda',

    tournament_remove: 'Usuń',
    tournament_remove_confirm: 'Usunąć ten turniej wraz z wszystkimi meczami?',

    podium_title: 'Koniec turnieju!',
    podium_congrats: 'Gratulacje dla wszystkich graczy!',
    podium_1st: '1. Miejsce',
    podium_2nd: '2. Miejsce',
    podium_3rd: '3. Miejsce',
    podium_close: 'Zamknij',

    match_title: 'Wpisz wynik meczu',
    match_tied: 'Wyniki nie mogą być równe.',
    match_cancel: 'Anuluj',
    match_save: 'Zapisz',
  },
} satisfies Record<Lang, Record<string, string>>

type Keys = keyof typeof translations.en

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: Keys) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang')
    return stored === 'pl' ? 'pl' : 'en'
  })

  function setLangPersisted(l: Lang) {
    localStorage.setItem('lang', l)
    setLang(l)
  }

  function t(key: Keys): string {
    return translations[lang][key]
  }

  return (
    <LangContext.Provider value={{ lang, setLang: setLangPersisted, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}

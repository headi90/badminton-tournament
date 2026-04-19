import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PlayersPage from './pages/PlayersPage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import { useLang } from './lib/i18n'

function Nav() {
  const { t, lang, setLang } = useLang()
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `font-bold text-lg ${isActive ? 'text-green-700' : 'text-green-700 hover:text-green-800'}`
          }
        >
          {t('nav_home')}
        </NavLink>
        <NavLink
          to="/players"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-green-700 border-b-2 border-green-700 pb-[2px]' : 'text-gray-500 hover:text-gray-800'}`
          }
        >
          {t('nav_players')}
        </NavLink>
        <NavLink
          to="/tournaments"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-green-700 border-b-2 border-green-700 pb-[2px]' : 'text-gray-500 hover:text-gray-800'}`
          }
        >
          {t('nav_tournaments')}
        </NavLink>

        <div className="ml-auto flex gap-1">
          {(['en', 'pl'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                lang === l
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

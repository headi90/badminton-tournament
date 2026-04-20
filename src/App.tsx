import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PlayersPage from './pages/PlayersPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import LoginPage from './pages/LoginPage'
import { AuthProvider, useAuth } from './lib/auth'
import { useLang } from './lib/i18n'

function Nav() {
  const { t, lang, setLang } = useLang()
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `font-bold text-lg ${isActive ? 'text-green-700 border-b-2 border-green-700 pb-[2px]' : 'text-green-700 hover:text-green-800'}`
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

        <div className="ml-auto flex items-center gap-2">
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
          {isAdmin ? (
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700 ml-1"
            >
              {t('nav_logout')}
            </button>
          ) : (
            <NavLink
              to="/login"
              className="text-xs text-gray-400 hover:text-gray-700 ml-1"
            >
              {t('nav_login')}
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Nav />
          <main>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/players" element={<PlayersPage />} />
              <Route path="/players/:id" element={<PlayerProfilePage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PlayersPage from './pages/PlayersPage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-6">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `font-bold text-lg ${isActive ? 'text-green-700' : 'text-green-700 hover:text-green-800'}`
              }
            >
              🏸 Badminton
            </NavLink>
            <NavLink
              to="/players"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-green-700 border-b-2 border-green-700 pb-[2px]' : 'text-gray-500 hover:text-gray-800'}`
              }
            >
              Players
            </NavLink>
            <NavLink
              to="/tournaments"
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-green-700 border-b-2 border-green-700 pb-[2px]' : 'text-gray-500 hover:text-gray-800'}`
              }
            >
              Tournaments
            </NavLink>
          </div>
        </nav>

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

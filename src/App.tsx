import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import PlayersPage from './pages/PlayersPage'
import TournamentsPage from './pages/TournamentsPage'
import TournamentDetailPage from './pages/TournamentDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-6">
            <span className="font-bold text-green-700 text-lg">🏸 Badminton</span>
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
            <Route path="/" element={<Navigate to="/tournaments" replace />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

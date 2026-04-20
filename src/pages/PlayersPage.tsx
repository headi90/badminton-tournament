import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Player } from '../lib/types'
import * as db from '../lib/db'
import { useAuth } from '../lib/auth'
import { useLang } from '../lib/i18n'

export default function PlayersPage() {
  const { t } = useLang()
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [name, setName] = useState('')
  const [duplicate, setDuplicate] = useState(false)

  async function load() {
    setPlayers(await db.getPlayers())
  }

  useEffect(() => { void load() }, [])

  async function addPlayer() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setDuplicate(true)
      return
    }
    await db.addPlayer(trimmed)
    setName('')
    setDuplicate(false)
    void load()
  }

  async function removePlayer(id: string) {
    if (!confirm(t('players_remove_confirm'))) return
    await db.removePlayer(id)
    void load()
  }

  async function removeAllPlayers() {
    if (!confirm(t('players_remove_all_confirm'))) return
    await Promise.all(players.map(p => db.removePlayer(p.id)))
    void load()
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('players_heading')}</h1>
        {isAdmin && players.length > 0 && (
          <button
            onClick={removeAllPlayers}
            className="text-xs text-red-500 border border-red-400 rounded-full px-3 py-0.5 hover:bg-red-50"
          >
            {t('detail_remove_all')}
          </button>
        )}
      </div>

      {isAdmin && (
        <>
          <div className="flex gap-2 mb-1">
            <input
              type="text"
              placeholder={t('players_placeholder')}
              value={name}
              onChange={e => { setName(e.target.value); setDuplicate(false) }}
              onKeyDown={e => e.key === 'Enter' && void addPlayer()}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => void addPlayer()}
              disabled={!name.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {t('players_add')}
            </button>
          </div>
          {duplicate && (
            <p className="text-red-500 text-sm mb-4">{t('players_duplicate')}</p>
          )}
        </>
      )}

      {players.length === 0 ? (
        <p className="text-gray-400 text-center py-8">{t('players_empty')}</p>
      ) : (
        <ul className="space-y-2">
          {players.map(p => (
            <li key={p.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
              <Link to={`/players/${p.id}`} className="font-medium text-gray-700 hover:text-green-700">{p.name}</Link>
              {isAdmin && (
                <button
                  onClick={() => void removePlayer(p.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  {t('players_remove')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

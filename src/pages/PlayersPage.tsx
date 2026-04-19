import { useEffect, useState } from 'react'
import { supabase, type Player } from '../lib/supabase'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('players').select('*').order('created_at')
    setPlayers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addPlayer() {
    const trimmed = name.trim()
    if (!trimmed) return
    await supabase.from('players').insert({ name: trimmed })
    setName('')
    load()
  }

  async function removePlayer(id: string) {
    if (!confirm('Remove this player?')) return
    setDeleting(id)
    await supabase.from('players').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Players</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Player name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPlayer()}
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={addPlayer}
          disabled={!name.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Loading…</p>
      ) : players.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No players yet.</p>
      ) : (
        <ul className="space-y-2">
          {players.map(p => (
            <li key={p.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
              <span className="font-medium text-gray-700">{p.name}</span>
              <button
                onClick={() => removePlayer(p.id)}
                disabled={deleting === p.id}
                className="text-red-500 hover:text-red-700 text-sm disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

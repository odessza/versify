import { useState, useEffect } from 'react'

const TOKEN_KEY = 'shoegaze_admin_token'

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function StatusBadge({ lyric }) {
  if (lyric.published) {
    return (
      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
        Published
      </span>
    )
  }
  if (lyric.approved) {
    return (
      <span className="text-xs font-medium text-[#ff5c00] bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
        Scheduled
      </span>
    )
  }
  return (
    <span className="text-xs font-medium text-[#0a0a0a]/40 bg-[#0a0a0a]/5 px-2 py-0.5 rounded-full whitespace-nowrap">
      Draft
    </span>
  )
}

export default function Admin() {
  const [token, setToken] = useState(null)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)

  const [lyrics, setLyrics] = useState([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState(null)
  const [regenState, setRegenState] = useState({})

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY)
    if (stored) {
      setToken(stored)
      loadLyrics(stored)
    }
  }, [])

  async function loadLyrics(t) {
    setLyricsLoading(true)
    const res = await fetch('/api/admin-lyrics', {
      headers: { Authorization: `Bearer ${t}` },
    })
    if (res.ok) {
      const data = await res.json()
      setLyrics(data.lyrics)
    }
    setLyricsLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const { token: t } = await res.json()
      sessionStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      loadLyrics(t)
    } else {
      setAuthError('Wrong password.')
    }
    setAuthLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateResult(null)
    const res = await fetch('/api/admin-generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setGenerateResult(data.exists ? 'exists' : 'success')
      if (!data.exists) loadLyrics(token)
    } else {
      setGenerateResult('error')
    }
    setGenerating(false)
  }

  async function handleRegenerate(lyric) {
    setRegenState(s => ({ ...s, [lyric.id]: 'regenerating' }))
    const res = await fetch('/api/admin-regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: lyric.id }),
    })
    if (res.ok) {
      setRegenState(s => { const n = { ...s }; delete n[lyric.id]; return n })
      loadLyrics(token)
    } else {
      setRegenState(s => ({ ...s, [lyric.id]: 'error' }))
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-xs px-6">
          <p className="text-sm font-bold tracking-widest uppercase text-[#0a0a0a] mb-8">Admin</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border border-[#0a0a0a]/15 p-3 text-sm text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 focus:outline-none focus:border-[#0a0a0a]/40 mb-3"
            />
            {authError && <p className="text-xs text-red-500 mb-3">{authError}</p>}
            <button
              type="submit"
              disabled={!password || authLoading}
              className="w-full bg-[#ff5c00] text-white text-sm font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#e05200] transition-colors"
            >
              {authLoading ? 'Checking…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-lg font-bold text-[#0a0a0a]">Lyrics</h1>
        <div className="flex items-center gap-3">
          {generateResult === 'success' && <p className="text-xs text-[#0a0a0a]/40">Generated.</p>}
          {generateResult === 'exists' && <p className="text-xs text-[#0a0a0a]/40">Already scheduled.</p>}
          {generateResult === 'error' && <p className="text-xs text-red-500">Generation failed.</p>}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm text-[#0a0a0a]/60 border border-[#0a0a0a]/15 px-4 py-2 hover:border-[#0a0a0a]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating…' : 'Generate tomorrow'}
          </button>
        </div>
      </div>

      {lyricsLoading && <p className="text-sm text-[#0a0a0a]/40">Loading…</p>}

      {!lyricsLoading && lyrics.length === 0 && (
        <p className="text-sm text-[#0a0a0a]/40">No lyrics yet.</p>
      )}

      {!lyricsLoading && lyrics.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#0a0a0a]/10">
                <th className="text-left text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 pb-3 pr-6 whitespace-nowrap">Date</th>
                <th className="text-left text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 pb-3 pr-6">Lyric</th>
                <th className="text-left text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 pb-3 pr-6 whitespace-nowrap">Song</th>
                <th className="text-left text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 pb-3 pr-4">Status</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {lyrics.map(lyric => (
                <tr key={lyric.id} className="border-b border-[#0a0a0a]/5 hover:bg-[#0a0a0a]/[0.015]">
                  <td className="py-4 pr-6 text-[#0a0a0a]/50 whitespace-nowrap align-top text-xs">
                    {formatDate(lyric.date)}
                  </td>
                  <td className="py-4 pr-6 text-[#0a0a0a] font-medium leading-snug align-top max-w-sm">
                    <span className="line-clamp-2">{lyric.lyric_text}</span>
                  </td>
                  <td className="py-4 pr-6 align-top whitespace-nowrap">
                    <span className="text-[#0a0a0a]/70">{lyric.song}</span>
                    <br />
                    <span className="text-[#0a0a0a]/40 text-xs">{lyric.artist}</span>
                  </td>
                  <td className="py-4 pr-4 align-top">
                    <StatusBadge lyric={lyric} />
                  </td>
                  <td className="py-4 align-top">
                    {!lyric.published && (
                      regenState[lyric.id] === 'error'
                        ? <span className="text-xs text-red-500">Failed</span>
                        : (
                          <button
                            onClick={() => handleRegenerate(lyric)}
                            disabled={regenState[lyric.id] === 'regenerating'}
                            className="text-xs text-[#0a0a0a]/30 hover:text-[#0a0a0a]/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                          >
                            {regenState[lyric.id] === 'regenerating' ? 'Regenerating…' : 'Regenerate'}
                          </button>
                        )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
